import React, { useRef, useState } from 'react';
import { VideoMetadata } from '../types/optimizer';
import { UploadCloud, CheckCircle2, X, Play, ShieldCheck } from 'lucide-react';

interface DropzoneProps {
  selectedVideo: VideoMetadata | null;
  onSelectFile: (file: File) => void;
  onClear: () => void;
  disabled: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ selectedVideo, onSelectFile, onClear, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      onSelectFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onSelectFile(e.target.files[0]);
          }
        }}
      />

      {!selectedVideo ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.25)] scale-[1.01]'
              : 'border-white/10 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-zinc-900/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3.5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-transform shadow-md">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-100">
                Pilih atau Tarik Video ke Sini
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Sokong fail MP4, MOV, reels, video kamera & galeri telefon
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Proses Pada Telefon (Zero Upload / Privasi Penuh)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Video Selected Card */
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4.5 backdrop-blur-md shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-white/10 shadow-inner">
                <video src={selectedVideo.previewUrl} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white/90 fill-white/80" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono font-bold text-white">
                  {Math.floor(selectedVideo.durationSeconds)}s
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-100 truncate">{selectedVideo.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Saiz: <span className="text-zinc-200 font-semibold">{selectedVideo.sizeMb.toFixed(1)} MB</span>
                  {' • '}
                  Durasi: <span className="text-zinc-200 font-semibold">{Math.round(selectedVideo.durationSeconds)}s</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sedia untuk dioptimumkan</span>
                </div>
              </div>
            </div>

            {!disabled && (
              <button
                onClick={onClear}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Tukar Video"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
