import React, { useState } from 'react';
import { OptimizerSettings } from '../types/optimizer';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';

interface SettingsCardProps {
  settings: OptimizerSettings;
  onChange: (updated: OptimizerSettings) => void;
  videoDuration: number;
  disabled: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  settings,
  onChange,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-3 backdrop-blur-md">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition py-0.5"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          Pilihan Lanjutan ({settings.quality}, {settings.autoSplit30s ? 'Auto-Split 30s' : 'Penuh'})
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="pt-3 mt-2 border-t border-white/5 space-y-3 animate-fade-in text-xs">
          {/* Auto-Split Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium">Potong automatik 30 saat</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...settings, autoSplit30s: !settings.autoSplit30s })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.autoSplit30s ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.autoSplit30s ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Quality */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium">Kualiti Output</span>
            <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => onChange({ ...settings, quality: '1080p' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settings.quality === '1080p' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                1080p
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, quality: '720p' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settings.quality === '720p' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                720p
              </button>
            </div>
          </div>

          {/* Mute Audio */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium">Padam Audio (Mute)</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...settings, muteAudio: !settings.muteAudio })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.muteAudio ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.muteAudio ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
