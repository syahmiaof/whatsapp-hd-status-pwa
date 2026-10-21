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
  sourceDuration?: number,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<TranscodeClipResult[]> {
  if (signal?.aborted) {
    throw new DOMException('Proses transcoding telah dibatalkan', 'AbortError');
  }

  const duration = sourceDuration && Number.isFinite(sourceDuration) ? sourceDuration : 0;

  // For short clips, do not create an unnecessary lossy generation. WhatsApp
  // will process the upload anyway; preserving the source gives it the best
  // available input and avoids downloading/starting the 32 MB WASM engine.
  if (duration > 0 && duration <= 30 && !settings.muteAudio) {
    const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'mp4';
    const blob = file.slice(0, file.size, file.type || mimeTypeForExtension(extension));
    const downloadUrl = URL.createObjectURL(blob);
    onProgress(100);
    return [{
      index: 1,
      blob,
      downloadUrl,
      filename: `StatusHD_Original.${extension}`,
      startTime: 0,
      endTime: duration,
      duration,
      sizeMb: blob.size / (1024 * 1024),
      preservedOriginal: true,
    }];
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

    // 2. Preserve orientation/aspect ratio and never upscale. Use Lanczos only
    // when a fallback transcode is required; no padding or forced frame rate.
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
      '-g', '60',
    ];

    if (!settings.muteAudio) {
      baseArgs.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2');
    }

    const results: TranscodeClipResult[] = [];

    if (settings.autoSplit30s) {
      // First attempt packet-copy segmentation. This keeps the compressed
      // video/audio bitstreams untouched. Boundaries land on source keyframes,
      // so a part can differ slightly from exactly 30 seconds.
      const copyArgs = [
        '-i', activeInputPath,
        '-map', '0:v:0',
        ...(settings.muteAudio ? ['-an'] : ['-map', '0:a:0?']),
        '-sn', '-dn',
        '-c', 'copy',
        '-f', 'segment',
        '-segment_time', '30',
        '-segment_time_delta', '0.05',
        '-reset_timestamps', '1',
        '-segment_format_options', 'movflags=+faststart',
        `${outputPrefix}_%03d.mp4`
      ];

      let exitCode = -1;
      try {
        exitCode = await ffmpeg.exec(copyArgs, undefined, { signal });
      } catch (copyError) {
        if (signal?.aborted) throw copyError;
        console.warn('Stream-copy segmentation gagal; cuba encode untuk keserasian.', copyError);
      }
      let generatedFiles = (await ffmpeg.listDir('/')).filter(
        (entry) => !entry.isDir && entry.name.startsWith(outputPrefix) && entry.name.endsWith('.mp4')
      );

      // Some codecs/containers cannot be copied into MP4. Remove partial files
      // and fall back to a compatibility encode only in that case.
      if (exitCode !== 0 || generatedFiles.length === 0) {
        for (const entry of generatedFiles) await ffmpeg.deleteFile(entry.name).catch(() => undefined);
        try {
          exitCode = await ffmpeg.exec([
            ...baseArgs,
            '-f', 'segment',
            '-segment_time', '30',
            '-reset_timestamps', '1',
            '-segment_format_options', 'movflags=+faststart',
            `${outputPrefix}_%03d.mp4`
          ], undefined, { signal });
        } catch (fallbackError) {
          if (signal?.aborted) throw fallbackError;
          throw new Error(`FFmpeg gagal semasa pembahagian video: ${String(fallbackError)}`);
        }
        if (exitCode !== 0) {
          throw new Error(`FFmpeg gagal semasa pembahagian video (Kod ralat: ${exitCode})`);
        }
        generatedFiles = (await ffmpeg.listDir('/')).filter(
          (entry) => !entry.isDir && entry.name.startsWith(outputPrefix) && entry.name.endsWith('.mp4')
        );
      }

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

function mimeTypeForExtension(extension: string): string {
  switch (extension) {
    case 'mov': return 'video/quicktime';
    case 'webm': return 'video/webm';
    case '3gp': return 'video/3gpp';
    default: return 'video/mp4';
  }
}
