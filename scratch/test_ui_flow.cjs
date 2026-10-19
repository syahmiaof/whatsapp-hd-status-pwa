const { chromium } = require('playwright');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const appUrl = process.env.STATSDHD_TEST_URL || 'http://127.0.0.1:4173';
const screenshotDir = process.env.STATUSHD_SCREENSHOT_DIR;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statushd-smoke-'));
const inputPath = path.join(tempDir, 'odd-dimensions.webm');
const outputPath = path.join(tempDir, 'status-part.mp4');

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
      '-f', 'lavfi', '-i', 'testsrc=size=541x961:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100',
      '-t', '4', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8',
      '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-shortest', '-y', inputPath,
    ]);
    const inputInfo = JSON.parse(run('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', inputPath,
    ]));
    if (inputInfo.streams[0].width !== 541 || inputInfo.streams[0].height !== 961) {
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
    await page.getByRole('button', { name: 'Sediakan untuk WhatsApp' }).click();
    await page.getByText(/Klip Siap/).waitFor({ timeout: 180_000 });
    await page.getByRole('button', { name: 'Preview' }).click();
    const preview = page.getByLabel('Preview Bahagian 1');
    await preview.waitFor({ timeout: 5_000 });
    await preview.evaluate((element) => element.readyState >= 1 ? true : new Promise((resolve, reject) => {
      element.addEventListener('loadedmetadata', resolve, { once: true });
      element.addEventListener('error', () => reject(new Error('Output preview failed to load')), { once: true });
    }));

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await page.getByTitle('Simpan Fail').click();
    const download = await downloadPromise;
    await download.saveAs(outputPath);

    const outputInfo = JSON.parse(run('ffprobe', [
      '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt',
      '-show_entries', 'format=duration', '-of', 'json', outputPath,
    ]));
    const video = outputInfo.streams.find((stream) => stream.codec_type === 'video');
    const audio = outputInfo.streams.find((stream) => stream.codec_type === 'audio');
    if (!video || video.codec_name !== 'h264' || video.width !== 1080 || video.height !== 1920 || video.r_frame_rate !== '30/1') {
      throw new Error(`Unexpected output video stream: ${JSON.stringify(video)}`);
    }
    if (!audio || audio.codec_name !== 'aac') {
      throw new Error(`Expected AAC audio stream, got: ${JSON.stringify(audio)}`);
    }
    if (pageErrors.length) {
      throw new Error(`Browser errors: ${pageErrors.join(' | ')}`);
    }
    console.log(JSON.stringify({
      input: { width: 541, height: 961, codec: 'vp9' },
      output: { width: video.width, height: video.height, codec: video.codec_name, fps: video.r_frame_rate, audio: audio.codec_name },
      duration: Number(outputInfo.format.duration),
      bytes: fs.statSync(outputPath).size,
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
