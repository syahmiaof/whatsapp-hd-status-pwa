import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { OptimizerSettings, TranscodeClipResult } from '../types/optimizer';

let ffmpegInstance: FFmpeg | null = null;

export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message));
  }

  try {
    // Cuba muat turun daripada fail tempatan (public/ffmpeg) terlebih dahulu
    const coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript');
    const wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm');
    await ffmpeg.load({ coreURL, wasmURL });
  } catch (err) {
    console.warn('Gagal memuat turun fail tempatan, mencuba fallback CDN...', err);
    // Fallback ke unpkg CDN rasmi
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function transcodeAndSplitVideo(
  file: File,
  settings: OptimizerSettings,
  onProgress: (percent: number) => void
): Promise<TranscodeClipResult[]> {
  const ffmpeg = await getFFmpeg();

  // Pantau progress
  const progressHandler = ({ progress }: { progress: number }) => {
    const rawPercent = Math.round(progress * 100);
    // Bataskan antara 5% hingga 95% semasa proses transcoding
    const clamped = Math.max(5, Math.min(rawPercent, 95));
    onProgress(clamped);
  };

  ffmpeg.on('progress', progressHandler);

  const inputExt = file.name.split('.').pop() || 'mp4';
  const inputName = `input_${Date.now()}.${inputExt}`;

  try {
    // 1. Tulis fail ke virtual filesystem WASM
    onProgress(5);
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputName, fileData);

    // 2. Sediakan parameter WhatsApp Sweet-Spot
    const crf = settings.quality === '1080p' ? '20' : '22';
    const scaleFilter = settings.quality === '1080p'
      ? 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2'
      : 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2';

    const baseArgs = [
      '-i', inputName,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-g', '30', // Keyframe setiap 1 saat untuk potongan tepat
    ];

    if (settings.muteAudio) {
      baseArgs.push('-an');
    } else {
      baseArgs.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
    }

    const outputPrefix = `status_clip_${Date.now()}`;
    const results: TranscodeClipResult[] = [];

    if (settings.autoSplit30s) {
      // Mod Potong 30 Saat
      const splitArgs = [
        ...baseArgs,
        '-f', 'segment',
        '-segment_time', '30',
        '-reset_timestamps', '1',
        '-segment_format_options', 'movflags=+faststart',
        `${outputPrefix}_%03d.mp4`
      ];

      await ffmpeg.exec(splitArgs);

      // Baca semua klip yang terhasil
      const dirList = await ffmpeg.listDir('/');
      const generatedFiles = dirList.filter(
        (f) => !f.isDir && f.name.startsWith(outputPrefix) && f.name.endsWith('.mp4')
      );

      // Susun mengikut urutan nama fail
      generatedFiles.sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < generatedFiles.length; i++) {
        const item = generatedFiles[i];
        const data = await ffmpeg.readFile(item.name);
        const blob = new Blob([(data as any)], { type: 'video/mp4' });
        const sizeMb = blob.size / (1024 * 1024);
        const downloadUrl = URL.createObjectURL(blob);

        results.push({
          index: i + 1,
          blob,
          downloadUrl,
          filename: `Status_Part_${i + 1}.mp4`,
          startTime: i * 30,
          endTime: (i + 1) * 30,
          duration: 30, // Anggaran purata segmen
          sizeMb,
        });

        // Bersihkan memori WASM serta-merta
        await ffmpeg.deleteFile(item.name);
      }
    } else {
      // Mod Video Penuh Tanpa Potong
      const singleOutName = `${outputPrefix}_full.mp4`;
      const singleArgs = [
        ...baseArgs,
        '-movflags', '+faststart',
        singleOutName
      ];

      await ffmpeg.exec(singleArgs);

      const data = await ffmpeg.readFile(singleOutName);
      const blob = new Blob([(data as any)], { type: 'video/mp4' });
      const sizeMb = blob.size / (1024 * 1024);
      const downloadUrl = URL.createObjectURL(blob);

      results.push({
        index: 1,
        blob,
        downloadUrl,
        filename: 'Status_HD_Optimized.mp4',
        startTime: 0,
        endTime: 0,
        duration: 0,
        sizeMb,
      });

      await ffmpeg.deleteFile(singleOutName);
    }

    // Bersihkan fail input asal dari virtual memori
    await ffmpeg.deleteFile(inputName);

    onProgress(100);
    return results;
  } catch (error) {
    console.error('Ralat semasa pemprosesan video:', error);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      // abaikan jika sudah tiada
    }
    throw error;
  }
}
