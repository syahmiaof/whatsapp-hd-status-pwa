import { FFmpeg, FFFSType } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { OptimizerSettings, TranscodeClipResult } from '../types/optimizer';

let ffmpegInstance: FFmpeg | null = null;

export function terminateFFmpeg(): void {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate();
    } catch {
      // abaikan jika gagal terminate
    }
    ffmpegInstance = null;
  }
}

export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message));
  }

  try {
    // 1. Muat turun fail daripada direktori tempatan (public/ffmpeg)
    const coreURL = new URL('/ffmpeg/ffmpeg-core.js', window.location.href).href;
    const wasmURL = new URL('/ffmpeg/ffmpeg-core.wasm', window.location.href).href;
    await ffmpeg.load({ coreURL, wasmURL });
  } catch (err) {
    console.warn('Gagal memuat turun fail tempatan, mencuba fallback CDN...', err);
    // 2. Fallback ke CDN rasmi unpkg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
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
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  sourceDuration?: number
): Promise<TranscodeClipResult[]> {
  if (signal?.aborted) {
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

  const ffmpeg = await getFFmpeg();

  // Pantau pembatalan luar jangka
  const abortHandler = () => {
    terminateFFmpeg();
  };
  signal?.addEventListener('abort', abortHandler, { once: true });

  const progressHandler = ({ progress }: { progress: number }) => {
    const rawPercent = Math.round(progress * 100);
    const clamped = Math.max(5, Math.min(rawPercent, 95));
    onProgress(clamped);
  };

  ffmpeg.on('progress', progressHandler);

  const inputExt = file.name.split('.').pop() || 'mp4';
  const uniqueId = Date.now();
  const outputPrefix = `status_clip_${uniqueId}`;
  const inputDir = '/input';
  const inputMountedPath = `${inputDir}/source.bin`;
  const fallbackInputName = `input_${uniqueId}.${inputExt}`;

  let isMounted = false;
  let activeInputPath = inputMountedPath;

  try {
    onProgress(5);

    // 1. Guna WORKERFS untuk mengelakkan penggandaan memori RAM pada fail besar
    try {
      await ffmpeg.createDir(inputDir).catch(() => undefined);
      await ffmpeg.mount(
        FFFSType.WORKERFS,
        {
          blobs: [{ name: 'source.bin', data: file }]
        },
        inputDir
      );
      isMounted = true;
      activeInputPath = inputMountedPath;
    } catch (mountErr) {
      console.warn('WORKERFS tidak disokong atau gagal dipasang, beralih ke mod writeFile virtual FS:', mountErr);
      isMounted = false;
      activeInputPath = fallbackInputName;
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile(fallbackInputName, fileData);
    }

    // 2. Parameter Optimum WhatsApp Sweet-Spot
    const width = settings.quality === '1080p' ? 1080 : 720;
    const height = settings.quality === '1080p' ? 1920 : 1280;
    const crf = settings.quality === '1080p' ? '20' : '22';

    // Filter diperkukuh: force_divisible_by=2, setsar=1, pad seimbang, fps tetap 30
    const videoFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;

    const baseArgs = [
      '-i', activeInputPath,
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-sn',
      '-dn',
      '-vf', videoFilter,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-sc_threshold', '0',
      '-force_key_frames', 'expr:gte(t,n_forced*30)',
      '-g', '30',
      '-fps_mode', 'cfr',
    ];

    if (settings.muteAudio) {
      baseArgs.push('-an');
    } else {
      baseArgs.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
    }

    const results: TranscodeClipResult[] = [];

    if (settings.autoSplit30s) {
      // Mod Potong 30 Saat Auto-Segment
      const splitArgs = [
        ...baseArgs,
        '-f', 'segment',
        '-segment_time', '30',
        '-reset_timestamps', '1',
        '-segment_format_options', 'movflags=+faststart',
        `${outputPrefix}_%03d.mp4`
      ];

      const exitCode = await ffmpeg.exec(splitArgs, undefined, { signal });
      if (exitCode !== 0) {
        throw new Error(`FFmpeg gagal semasa pembahagian video (Kod ralat: ${exitCode})`);
      }

      // Senaraikan fail yang terhasil
      const dirList = await ffmpeg.listDir('/');
      const generatedFiles = dirList.filter(
        (f) => !f.isDir && f.name.startsWith(outputPrefix) && f.name.endsWith('.mp4')
      );
      generatedFiles.sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < generatedFiles.length; i++) {
        const item = generatedFiles[i];
        const data = await ffmpeg.readFile(item.name);
        const blob = new Blob([(data as any)], { type: 'video/mp4' });
        const sizeMb = blob.size / (1024 * 1024);
        const downloadUrl = URL.createObjectURL(blob);

        const startTime = i * 30;
        const endTime = (sourceDuration && sourceDuration > 0)
          ? Math.min((i + 1) * 30, sourceDuration)
          : (i + 1) * 30;
        const duration = Math.max(0.1, endTime - startTime);

        results.push({
          index: i + 1,
          blob,
          downloadUrl,
          filename: `Status_Part_${i + 1}.mp4`,
          startTime,
          endTime,
          duration,
          sizeMb,
        });

        // Hapus fail daripada virtual memori WASM serta-merta selepas dibaca
        await ffmpeg.deleteFile(item.name).catch(() => undefined);
      }
    } else {
      // Mod Video Penuh Tanpa Pemotongan
      const singleOutName = `${outputPrefix}_full.mp4`;
      const singleArgs = [
        ...baseArgs,
        '-movflags', '+faststart',
        singleOutName
      ];

      const exitCode = await ffmpeg.exec(singleArgs, undefined, { signal });
      if (exitCode !== 0) {
        throw new Error(`FFmpeg gagal semasa pemprosesan video (Kod ralat: ${exitCode})`);
      }

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
        endTime: sourceDuration || 0,
        duration: sourceDuration || 0,
        sizeMb,
      });

      await ffmpeg.deleteFile(singleOutName).catch(() => undefined);
    }

    onProgress(100);
    return results;
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Proses transcoding telah dibatalkan oleh pengguna', 'AbortError');
    }
    throw error;
  } finally {
    signal?.removeEventListener('abort', abortHandler);
    ffmpeg.off('progress', progressHandler);

    // Pembersihan sistem fail WASM
    if (isMounted) {
      try {
        await ffmpeg.unmount(inputDir);
      } catch {
        // Abaikan
      }
    } else {
      try {
        await ffmpeg.deleteFile(fallbackInputName);
      } catch {
        // Abaikan
      }
    }

    // Bersihkan sebarang fail segmen sementara yang mungkin tertinggal
    try {
      const list = await ffmpeg.listDir('/');
      for (const entry of list) {
        if (!entry.isDir && entry.name.startsWith(outputPrefix)) {
          await ffmpeg.deleteFile(entry.name).catch(() => undefined);
        }
      }
    } catch {
      // Abaikan
    }
  }
}
