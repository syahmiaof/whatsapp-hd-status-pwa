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
    <div className="rounded-2xl border border-[#e6ebe6] bg-white p-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-1 text-xs text-[#566258] transition hover:text-[#1d2c20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Sliders className="h-3.5 w-3.5 text-[#168347]" />
          Pilihan Lanjutan ({settings.quality}, {settings.autoSplit30s ? 'Auto-Split 30s' : 'Penuh'})
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3 border-t border-[#edf0ed] pt-3 text-xs animate-fade-in">
          {/* Auto-Split Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#344238]">Potong automatik 30 saat</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...settings, autoSplit30s: !settings.autoSplit30s })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.autoSplit30s ? 'bg-[#168347]' : 'bg-[#c9d0ca]'
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
            <span className="font-medium text-[#344238]">Kualiti output</span>
            <div className="flex rounded-lg border border-[#e6ebe6] bg-[#f4f6f4] p-0.5">
              <button
                type="button"
                onClick={() => onChange({ ...settings, quality: '1080p' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settings.quality === '1080p' ? 'bg-white text-[#176b3b] shadow-sm' : 'text-[#68746a] hover:text-[#263429]'
                }`}
              >
                1080p
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, quality: '720p' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  settings.quality === '720p' ? 'bg-white text-[#176b3b] shadow-sm' : 'text-[#68746a] hover:text-[#263429]'
                }`}
              >
                720p
              </button>
            </div>
          </div>

          {/* Mute Audio */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#344238]">Senyapkan audio</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...settings, muteAudio: !settings.muteAudio })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.muteAudio ? 'bg-[#168347]' : 'bg-[#c9d0ca]'
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
