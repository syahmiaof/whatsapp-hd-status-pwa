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
    <div className="space-y-4 rounded-3xl border border-[#dfe9e1] bg-white p-5 shadow-[0_8px_24px_rgba(23,32,25,0.06)] sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="h-5 w-5 animate-spin text-[#168347]" />
          <span className="text-sm font-bold text-[#202a22]">{getStageLabel()}</span>
        </div>
        <span className="font-mono text-base font-extrabold tabular-nums text-[#168347]">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-[#e7ece7] bg-[#f0f3f0] p-[2px]">
        <div
          className="h-full rounded-full bg-[#168347] transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, Math.min(progressPercent, 100))}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-[#68746a]">
        <span>
          {secondsRemaining !== null && secondsRemaining > 0 ? (
            <>Anggaran baki: <strong className="font-mono tabular-nums text-[#344238]">~{secondsRemaining}s</strong></>
          ) : (
            'Sedang memproses secara lokal...'
          )}
        </span>
        <button
          onClick={onCancel}
          className="text-[11px] font-semibold text-[#68746a] underline underline-offset-2 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          Batal
        </button>
      </div>
    </div>
  );
};
