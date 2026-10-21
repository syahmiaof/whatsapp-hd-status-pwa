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

export async function getFFmpeg(onLog?: (msg: string) => void, signal?: AbortSignal): Promise<FFmpeg> {
  if (signal?.aborted) {
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  // Expose the instance before loading so the UI can terminate its worker if
  // the user cancels while the core/WASM files are still being fetched.
  ffmpegInstance = ffmpeg;
  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message));
  }

  const abortHandler = () => {
    if (ffmpegInstance === ffmpeg) terminateFFmpeg();
  };
  signal?.addEventListener('abort', abortHandler, { once: true });

  try {
    // 1. Muat turun fail daripada direktori tempatan (public/ffmpeg)
    const coreURL = new URL('/ffmpeg/ffmpeg-core.js', window.location.href).href;
    const wasmURL = new URL('/ffmpeg/ffmpeg-core.wasm', window.location.href).href;
    await ffmpeg.load({ coreURL, wasmURL });
  } catch (err) {
    if (signal?.aborted) {
      throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
    }
    console.warn('Gagal memuat turun fail tempatan, mencuba fallback CDN...', err);
    // 2. Fallback ke CDN rasmi unpkg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }

  if (signal?.aborted || !ffmpeg.loaded) {
    if (ffmpegInstance === ffmpeg) terminateFFmpeg();
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

  return ffmpeg;
}

export async function transcodeAndSplitVideo(
  file: File,
  settings: OptimizerSettings,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  sourceDuration?: number,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<TranscodeClipResult[]> {
  if (signal?.aborted) {
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

  const duration = sourceDuration && Number.isFinite(sourceDuration) ? sourceDuration : 0;
  const ffmpeg = await getFFmpeg(undefined, signal);
  if (signal?.aborted) {
    terminateFFmpeg();
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

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

  const inputExt = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'mp4';
  const uniqueId = Date.now();
  const outputPrefix = `status_clip_${uniqueId}`;
  const inputDir = '/input';
  const inputMountedPath = `${inputDir}/source.bin`;
  const fallbackInputName = `input_${uniqueId}.${inputExt}`;

  let isMounted = false;
  let activeInputPath = inputMountedPath;
  const results: TranscodeClipResult[] = [];

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

    // Preserve orientation/aspect ratio and never upscale. The chosen preset
    // is applied to every clip, including short clips under 30 seconds.
    const presetMax = settings.quality === '1080p' ? 1080 : 720;
    const width = sourceWidth || 0;
    const height = sourceHeight || 0;
    const landscape = width > height;
    const longEdgeMax = presetMax === 1080 ? 1920 : 1280;
    const maxWidth = landscape
      ? Math.min(longEdgeMax, width || longEdgeMax)
      : Math.min(presetMax, width || presetMax);
    const maxHeight = landscape
      ? Math.min(presetMax, height || presetMax)
      : Math.min(longEdgeMax, height || longEdgeMax);
    const crf = settings.quality === '1080p' ? '20' : '22';
    const videoFilter = `scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,setsar=1`;

    const baseArgs = [
      '-i', activeInputPath,
      '-map', '0:v:0',
      ...(settings.muteAudio ? ['-an'] : ['-map', '0:a:0?']),
      '-sn',
      '-dn',
      '-vf', videoFilter,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'fast',
      '-profile:v', 'high',
      '-pix_fmt', 'yuv420p',
      '-sc_threshold', '0',
      '-force_key_frames', 'expr:gte(t,n_forced*30)',
      '-g', '120',
    ];

    if (!settings.muteAudio) {
      baseArgs.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2');
    }

    if (settings.autoSplit30s) {
      // Encode every output so the selected WhatsApp profile is actually
      // applied. Force a keyframe at each cut to keep segments close to 30 s.
      const exitCode = await ffmpeg.exec([
        ...baseArgs,
        '-f', 'segment',
        '-segment_time', '30',
        '-segment_time_delta', '0.05',
        '-reset_timestamps', '1',
        '-segment_format_options', 'movflags=+faststart',
        `${outputPrefix}_%03d.mp4`
      ], undefined, { signal });
      if (exitCode !== 0) {
        throw new Error(`FFmpeg gagal semasa pembahagian video (Kod ralat: ${exitCode})`);
      }

      const generatedFiles = (await ffmpeg.listDir('/')).filter(
        (entry) => !entry.isDir && entry.name.startsWith(outputPrefix) && entry.name.endsWith('.mp4')
      );

      if (generatedFiles.length === 0) {
        throw new Error('FFmpeg tamat tanpa menghasilkan klip. Cuba video lain atau matikan pilihan mute.');
      }

      generatedFiles.sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < generatedFiles.length; i++) {
        const item = generatedFiles[i];
        const data = await ffmpeg.readFile(item.name);
        const blob = new Blob([(data as any)], { type: 'video/mp4' });
        const sizeMb = blob.size / (1024 * 1024);
        const downloadUrl = URL.createObjectURL(blob);

        const startTime = i * 30;
        const endTime = (duration > 0)
          ? Math.min((i + 1) * 30, duration)
          : (i + 1) * 30;
        const clipDuration = Math.max(0.1, endTime - startTime);

        results.push({
          index: i + 1,
          blob,
          downloadUrl,
          filename: `Status_Part_${i + 1}.mp4`,
          startTime,
          endTime,
          duration: clipDuration,
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
        endTime: duration,
        duration,
        sizeMb,
      });

      await ffmpeg.deleteFile(singleOutName).catch(() => undefined);
    }

    onProgress(100);
    return results;
  } catch (error) {
    results.forEach((result) => URL.revokeObjectURL(result.downloadUrl));
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

