import React from 'react';
import { ProcessingStage } from '../types/optimizer';
import { Loader2 } from 'lucide-react';

interface TranscodeProgressProps {
  stage: ProcessingStage;
  progressPercent: number; // 0 to 100
  secondsRemaining: number | null;
  currentClipIndex: number;
  totalClips: number;
  onCancel: () => void;
}

export const TranscodeProgress: React.FC<TranscodeProgressProps> = ({
  stage,
  progressPercent,
  secondsRemaining,
  currentClipIndex,
  totalClips,
  onCancel,
}) => {
  const getStageLabel = () => {
    switch (stage) {
      case 'loading-wasm':
        return 'Memuat enjin FFmpeg WASM...';
      case 'analyzing':
        return 'Menganalisis audio & video...';
      case 'transcoding':
        return `Mengoptimumkan kualiti HD (${currentClipIndex}/${totalClips})...`;
      case 'splitting':
        return 'Menyusun klip 30 saat & atom faststart...';
      default:
        return 'Sedang memproses video...';
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-zinc-900/80 p-6 space-y-4 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.12)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-bold text-zinc-100">{getStageLabel()}</span>
        </div>
        <span className="text-base font-mono font-extrabold text-emerald-400">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3.5 bg-zinc-800/90 rounded-full overflow-hidden p-[2px] border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-green-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{ width: `${Math.max(5, Math.min(progressPercent, 100))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
        <span>
          {secondsRemaining !== null && secondsRemaining > 0 ? (
            <>Baki anggaran masa: <strong className="text-zinc-200 font-mono">~{secondsRemaining}s</strong></>
          ) : (
            'Sedang memproses secara lokal...'
          )}
        </span>
        <button
          onClick={onCancel}
          className="text-zinc-400 hover:text-rose-400 transition text-[11px] font-semibold underline"
        >
          Batal
        </button>
      </div>
    </div>
  );
};
