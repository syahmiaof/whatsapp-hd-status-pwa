import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { SettingsCard } from './components/SettingsCard';
import { TranscodeProgress } from './components/TranscodeProgress';
import { ProcessedClipsCard } from './components/ProcessedClipsCard';
import { PaywallModal } from './components/PaywallModal';
import {
  VideoMetadata,
  OptimizerSettings,
  ProcessingStage,
  TranscodeClipResult
} from './types/optimizer';
import { transcodeAndSplitVideo, terminateFFmpeg } from './lib/ffmpegEngine';
import { initTrial, activateVipKey } from './lib/trialManager';
import { Zap, AlertTriangle, Sparkles } from 'lucide-react';

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

  // Status Langganan & Percubaan
  const [trialState, setTrialState] = useState(() => initTrial());
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

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
    setTrialState(initTrial());
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

    // Semak jika tempoh percubaan tamat dan belum bayar
    if (trialState.daysLeft <= 0 && !trialState.isSubscribed) {
      setIsPaywallOpen(true);
      return;
    }

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* 1. Header Navigation */}
      <Header
        trialDaysLeft={trialState.daysLeft}
        isSubscribed={trialState.isSubscribed}
        onOpenPaywall={() => setIsPaywallOpen(true)}
      />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-3.5">
        {/* Ralat jika ada */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Hero Section Ringkas */}
        {!video && stage === 'idle' && (
          <div className="text-center space-y-2 pt-2 pb-1 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Siap untuk WhatsApp • Auto 30s</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">
              Sediakan video untuk WhatsApp Status.
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Pilih 720p atau 1080p; video diproses dalam telefon. WhatsApp mungkin memampatkannya semasa dimuat naik.
            </p>
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:brightness-110 text-zinc-950 font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Tukar ke Status HD</span>
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
      <footer className="py-4 text-center text-xs text-zinc-600 border-t border-white/5">
        <p>StatusHD PWA • Dikuasakan oleh FFmpeg WebAssembly • 100% Client-Side</p>
      </footer>

      {/* 4. Modal Paywall */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onActivateKey={(key) => {
          const success = activateVipKey(key);
          if (success) {
            setTrialState({ daysLeft: 999, isSubscribed: true });
          }
          return success;
        }}
      />
    </div>
  );
};
