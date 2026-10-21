const { chromium } = require('playwright');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const appUrl = process.env.STATSDHD_TEST_URL || 'http://127.0.0.1:4173';
const screenshotDir = process.env.STATUSHD_SCREENSHOT_DIR;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statushd-smoke-'));
const inputPath = path.join(tempDir, 'odd-dimensions-long.webm');
const outputPaths = [path.join(tempDir, 'status-part-1.mp4'), path.join(tempDir, 'status-part-2.mp4')];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) {
    throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

(async () => {
  let browser;
  try {
    // VP9/WebM preserves odd dimensions and is decodable by current Chromium.
    run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'testsrc=size=181x321:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100',
      '-t', '32', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8',
      '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-shortest', '-y', inputPath,
    ]);
    const inputInfo = JSON.parse(run('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', inputPath,
    ]));
    if (inputInfo.streams[0].width !== 181 || inputInfo.streams[0].height !== 321) {
      throw new Error('Fixture generation failed to preserve odd source dimensions.');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    await page.getByText('Beta · Percuma').waitFor({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Pilih video', exact: true }).waitFor({ timeout: 5_000 });
    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, 'statushd-mobile-home.png'), fullPage: true });
      const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto(appUrl, { waitUntil: 'networkidle' });
      await desktopPage.screenshot({ path: path.join(screenshotDir, 'statushd-desktop-home.png'), fullPage: true });
      await desktopContext.close();
    }
    await page.locator('input[type="file"]').setInputFiles(inputPath);
    await page.getByRole('button', { name: 'Sediakan video untuk WhatsApp' }).click();
    await page.getByText('Klip Siap (2 Bahagian)').waitFor({ timeout: 180_000 });
    await page.getByRole('button', { name: 'Preview' }).first().click();
    const preview = page.getByLabel('Preview Bahagian 1');
    await preview.waitFor({ timeout: 5_000 });
    await preview.evaluate((element) => element.readyState >= 1 ? true : new Promise((resolve, reject) => {
      element.addEventListener('loadedmetadata', resolve, { once: true });
      element.addEventListener('error', () => reject(new Error('Output preview failed to load')), { once: true });
    }));

    const outputs = [];
    for (let index = 0; index < outputPaths.length; index++) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
      await page.getByTitle('Simpan Fail').nth(index).click();
      const download = await downloadPromise;
      await download.saveAs(outputPaths[index]);

      const outputInfo = JSON.parse(run('ffprobe', [
        '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt',
        '-show_entries', 'format=duration', '-of', 'json', outputPaths[index],
      ]));
      const video = outputInfo.streams.find((stream) => stream.codec_type === 'video');
      const audio = outputInfo.streams.find((stream) => stream.codec_type === 'audio');
      if (!video || video.codec_name !== 'h264' || video.width !== 180 || video.height !== 320 || video.r_frame_rate !== '30/1') {
        throw new Error(`Unexpected output video stream ${index + 1}: ${JSON.stringify(video)}`);
      }
      if (!audio || audio.codec_name !== 'aac') {
        throw new Error(`Expected AAC audio stream in part ${index + 1}, got: ${JSON.stringify(audio)}`);
      }
      outputs.push({
        width: video.width,
        height: video.height,
        codec: video.codec_name,
        fps: video.r_frame_rate,
        audio: audio.codec_name,
        duration: Number(outputInfo.format.duration),
        bytes: fs.statSync(outputPaths[index]).size,
      });
    }
    if (outputs[0].duration < 29 || outputs[0].duration > 30.1 || outputs[1].duration < 1.5 || outputs[1].duration > 3) {
      throw new Error(`Unexpected split durations: ${JSON.stringify(outputs.map((output) => output.duration))}`);
    }
    if (pageErrors.length) {
      throw new Error(`Browser errors: ${pageErrors.join(' | ')}`);
    }
    console.log(JSON.stringify({
      input: { width: 181, height: 321, codec: 'vp9' },
      outputParts: outputs,
      pageErrors,
    }, null, 2));
    await context.close();
  } finally {
    if (browser) await browser.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

