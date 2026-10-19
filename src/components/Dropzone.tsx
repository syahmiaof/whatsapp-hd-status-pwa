import React, { useRef, useState } from 'react';
import { VideoMetadata } from '../types/optimizer';
import { Film, FolderOpen, Play, X } from 'lucide-react';

interface DropzoneProps {
  selectedVideo: VideoMetadata | null;
  onSelectFile: (file: File) => void;
  onClear: () => void;
  disabled: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ selectedVideo, onSelectFile, onClear, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const openPicker = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) onSelectFile(file);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        aria-label="Pilih video dari galeri"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelectFile(file);
          event.currentTarget.value = '';
        }}
      />

      {!selectedVideo ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex min-h-[min(66dvh,560px)] flex-col justify-center px-2 py-8 text-center transition-colors ${
            isDragOver
              ? 'rounded-3xl bg-emerald-50'
              : ''
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f7ed] text-[#137a40]">
            <Film className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-[23px] font-bold tracking-[-0.03em] text-[#171d18]">
            Pilih video dari galeri
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#657067]">
            Pilih satu video. StatusHD akan potong 30 saat dan sediakan untuk WhatsApp.
          </p>
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="mt-7 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[#138c4b] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(19,140,75,0.18)] transition hover:bg-[#0e773f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <FolderOpen className="h-4 w-4" />
            Pilih video
          </button>
          <p className="mt-4 text-xs text-[#7b857c]">Video kekal dalam telefon anda</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[26px] border border-[#e6ebe6] bg-white">
          <div className="relative flex max-h-[52vh] min-h-56 justify-center bg-[#101411]">
            <video
              src={selectedVideo.previewUrl}
              className="max-h-[52vh] w-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              aria-label="Tukar video"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#202720]">{selectedVideo.name}</p>
              <p className="mt-1 text-xs text-[#6f7a70]">
                {Math.round(selectedVideo.durationSeconds)}s · {selectedVideo.width}×{selectedVideo.height} · {selectedVideo.sizeMb.toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              className="inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-xl bg-[#f1f5f1] px-3 text-xs font-semibold text-[#344238] transition hover:bg-[#e7eee8] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <Play className="h-3.5 w-3.5" /> Tukar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
