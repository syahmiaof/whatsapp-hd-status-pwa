import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { SettingsCard } from './components/SettingsCard';
import { TranscodeProgress } from './components/TranscodeProgress';
import { ProcessedClipsCard } from './components/ProcessedClipsCard';
import {
  VideoMetadata,
  OptimizerSettings,
  ProcessingStage,
  TranscodeClipResult
} from './types/optimizer';
import { transcodeAndSplitVideo, terminateFFmpeg } from './lib/ffmpegEngine';
import { Zap, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [settings, setSettings] = useState<OptimizerSettings>({
    autoSplit30s: true,
    quality: '1080p',
    muteAudio: false,
  });

  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [clips, setClips] = useState<TranscodeClipResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kawalan Pembatalan Transcode
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper pembersihan Object URL untuk mengelakkan kebocoran RAM
  const releaseVideo = (v: VideoMetadata | null) => {
    if (v?.previewUrl) {
      try {
        URL.revokeObjectURL(v.previewUrl);
      } catch {
        // Abaikan
      }
    }
  };

  const releaseClips = (clipList: TranscodeClipResult[]) => {
    clipList.forEach((clip) => {
      if (clip.downloadUrl) {
        try {
          URL.revokeObjectURL(clip.downloadUrl);
        } catch {
          // Abaikan
        }
      }
    });
  };

  useEffect(() => {
    return () => {
      // Pembersihan semasa komponen dinyahpasang
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      terminateFFmpeg();
    };
  }, []);

  // Anggaran masa baki berdasarkan progress
  useEffect(() => {
    if (stage === 'transcoding' && progress > 0 && progress < 100) {
      const estimatedTotal = (video?.durationSeconds || 30) * 0.8;
      const left = Math.max(1, Math.round((1 - progress / 100) * estimatedTotal));
      setEtaSeconds(left);
    }
  }, [stage, progress, video]);

  const handleSelectFile = (file: File) => {
    setErrorMessage(null);

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Pilih fail video yang disokong seperti MP4 atau MOV.');
      return;
    }

    // Bebaskan memori fail lama serta-merta
    setVideo((prev) => {
      releaseVideo(prev);
      return null;
    });
    setClips((prev) => {
      releaseClips(prev);
      return [];
    });

    const previewUrl = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.src = previewUrl;

    videoEl.onloadedmetadata = () => {
      if (!Number.isFinite(videoEl.duration) || videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
        URL.revokeObjectURL(previewUrl);
        setErrorMessage('Metadata video tak dapat dibaca. Cuba eksport semula video sebagai MP4 atau MOV.');
        setStage('idle');
        return;
      }
      setVideo({
        file,
        name: file.name,
        sizeMb: file.size / (1024 * 1024),
        durationSeconds: videoEl.duration || 30,
        previewUrl,
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
      });
      setStage('idle');
      setProgress(0);
    };

    videoEl.onerror = () => {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // Abaikan
      }
      setErrorMessage('Gagal membaca fail video. Format mungkin rosak atau tidak disokong oleh pelayar.');
      setStage('idle');
    };
  };

  const handleStartTranscoding = async () => {
    if (!video) return;

    setErrorMessage(null);
    setStage('loading-wasm');
    setProgress(5);

    // Bebaskan klip lama sebelum proses baharu bermula
    setClips((prev) => {
      releaseClips(prev);
      return [];
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setStage('transcoding');
      const results = await transcodeAndSplitVideo(
        video.file,
        settings,
        (currentProgress) => {
          setProgress(currentProgress);
        },
        controller.signal,
        video.durationSeconds
      );

      setClips(results);
      setStage('completed');
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError') {
        // Pembatalan mesra oleh pengguna - kembali ke sedia tanpa banner ralat
        setStage('idle');
        setProgress(0);
        setEtaSeconds(null);
        return;
      }
      console.error('Ralat pemprosesan video:', err);
      setStage('error');
      setErrorMessage(
        err?.message || 'Ralat berlaku semasa pemprosesan video. Sila cuba kualiti 720p atau video yang lebih ringkas.'
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelTranscoding = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    terminateFFmpeg();
    setStage('idle');
    setProgress(0);
    setEtaSeconds(null);
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setVideo((prev) => {
      releaseVideo(prev);
      return null;
    });
    setClips((prev) => {
      releaseClips(prev);
      return [];
    });
    setStage('idle');
    setProgress(0);
    setEtaSeconds(null);
    setErrorMessage(null);
  };

  const handleDownloadAll = () => {
    clips.forEach((clip, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = clip.downloadUrl;
        a.download = clip.filename;
        a.click();
      }, index * 300);
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f4] font-sans text-[#172019] selection:bg-emerald-200 selection:text-[#102016]">
      {/* 1. Header Navigation */}
      <Header />

      {/* 2. Main Content */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-5 sm:px-6 sm:pt-7">
        {/* Ralat jika ada */}
        {errorMessage && (
          <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Status Dropzone */}
        <Dropzone
          selectedVideo={video}
          onSelectFile={handleSelectFile}
          onClear={handleReset}
          disabled={stage === 'transcoding' || stage === 'loading-wasm'}
        />

        {/* Tetapan & Butang Transcode */}
        {video && stage === 'idle' && (
          <div className="space-y-3 animate-fade-in">
            <button
              onClick={handleStartTranscoding}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#138c4b] py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(19,140,75,0.18)] transition hover:bg-[#0e773f] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              <Zap className="h-4 w-4" />
              <span>Sediakan untuk WhatsApp</span>
            </button>

            <SettingsCard
              settings={settings}
              onChange={setSettings}
              videoDuration={video.durationSeconds}
              disabled={false}
            />
          </div>
        )}

        {/* Progress Bar semasa Transcoding */}
        {(stage === 'transcoding' || stage === 'loading-wasm') && (
          <TranscodeProgress
            stage={stage}
            progressPercent={progress}
            secondsRemaining={etaSeconds}
            currentClipIndex={1}
            totalClips={settings.autoSplit30s && video ? Math.max(1, Math.ceil(video.durationSeconds / 30)) : 1}
            onCancel={handleCancelTranscoding}
          />
        )}

        {/* Kad Klip Siap */}
        {stage === 'completed' && clips.length > 0 && (
          <ProcessedClipsCard
            clips={clips}
            onDownloadClip={(clip) => {
              const a = document.createElement('a');
              a.href = clip.downloadUrl;
              a.download = clip.filename;
              a.click();
            }}
            onDownloadAll={handleDownloadAll}
            onReset={handleReset}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#e6ebe6] px-4 py-4 text-center text-[11px] text-[#778178]">
        <p>Video diproses dalam telefon anda · Tak dimuat naik ke server</p>
      </footer>

    </div>
  );
};
