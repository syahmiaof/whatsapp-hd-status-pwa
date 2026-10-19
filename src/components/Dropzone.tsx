import React, { useRef, useState } from 'react';
import { VideoMetadata } from '../types/optimizer';
import { Plus, X, Play, Video } from 'lucide-react';

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
        /* Minimalist File Picker Card */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border transition-all duration-200 p-8 text-center flex flex-col items-center justify-center space-y-3 ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.2)] scale-[1.01]'
              : 'border-white/10 hover:border-emerald-500/40 bg-zinc-900/40 hover:bg-zinc-900/70 shadow-lg'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-base font-bold text-zinc-100 tracking-tight">
              Pilih Video
            </p>
            <p className="text-xs text-zinc-400">
              Auto potong 30s • sehingga 1080p
            </p>
          </div>
        </div>
      ) : (
        /* Video Selected - Minimal Row */
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 backdrop-blur-md shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
              <video src={selectedVideo.previewUrl} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{selectedVideo.name}</p>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {Math.round(selectedVideo.durationSeconds)}s • {selectedVideo.sizeMb.toFixed(1)} MB
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="Tukar Video"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
