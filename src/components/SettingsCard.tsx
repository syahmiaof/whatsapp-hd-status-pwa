import React from 'react';
import { OptimizerSettings } from '../types/optimizer';
import { Scissors, Sliders, Check } from 'lucide-react';

interface SettingsCardProps {
  settings: OptimizerSettings;
  onChange: (updated: OptimizerSettings) => void;
  videoDuration: number;
  disabled: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  settings,
  onChange,
  videoDuration,
  disabled
}) => {
  const estimatedClips = settings.autoSplit30s && videoDuration > 0
    ? Math.max(1, Math.ceil(videoDuration / 30))
    : 1;

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 space-y-4.5 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> Konfigurasi Video
        </span>
        <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          WhatsApp HD Formula
        </span>
      </div>

      {/* Auto Split 30s Toggle */}
      <div className="flex items-center justify-between py-1">
        <div>
          <label className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-emerald-400" />
            Auto-Split 30 Saat
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 font-bold">
              Disyorkan
            </span>
          </label>
          <p className="text-xs text-zinc-400 mt-0.5">
            Potong video automatik ikut had WhatsApp Status ({estimatedClips} bahagian klip).
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...settings, autoSplit30s: !settings.autoSplit30s })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.autoSplit30s ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.autoSplit30s ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Pilihan Kualiti Preset */}
      <div>
        <label className="text-xs font-semibold text-zinc-300 block mb-2.5">
          Resolusi & Ketajaman Output
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Ultra HD 1080p */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...settings, quality: '1080p' })}
            className={`p-3.5 rounded-2xl border text-left transition relative ${
              settings.quality === '1080p'
                ? 'border-emerald-500 bg-emerald-500/10 text-zinc-100 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                : 'border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-white/20'
            }`}
          >
            {settings.quality === '1080p' && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-zinc-100">Ultra HD</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">1080p</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Kualiti kristal maksimum (CRF 20)</p>
          </button>

          {/* Standard HD 720p */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...settings, quality: '720p' })}
            className={`p-3.5 rounded-2xl border text-left transition relative ${
              settings.quality === '720p'
                ? 'border-emerald-500 bg-emerald-500/10 text-zinc-100 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                : 'border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-white/20'
            }`}
          >
            {settings.quality === '720p' && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-zinc-100">Standard HD</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">720p</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Proses lebih pantas & jimat memori</p>
          </button>
        </div>
      </div>
    </div>
  );
};
