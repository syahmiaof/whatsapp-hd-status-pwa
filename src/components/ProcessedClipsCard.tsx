import React, { useState } from 'react';
import { TranscodeClipResult } from '../types/optimizer';
import { Download, Share2, Sparkles, RefreshCw, Film, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProcessedClipsCardProps {
  clips: TranscodeClipResult[];
  onDownloadClip: (clip: TranscodeClipResult) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

export const ProcessedClipsCard: React.FC<ProcessedClipsCardProps> = ({
  clips,
  onDownloadClip,
  onDownloadAll,
  onReset,
}) => {
  const [sharingIndex, setSharingIndex] = useState<number | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Trigger celebration confetti upon mount
  React.useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#14b8a6', '#25D366']
    });
  }, []);

  const handleShareToWhatsApp = async (clip: TranscodeClipResult) => {
    setSharingIndex(clip.index);
    setShareNotice(null);

    try {
      const file = new File([clip.blob], clip.filename, { type: 'video/mp4' });

      // Semak jika pelayar menyokong Web Share API untuk fail
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `WhatsApp HD Status (${clip.filename})`,
            text: 'Status HD siap dipotong!',
          });
          return;
        } catch (shareErr: any) {
          // Jika pengguna tutup share sheet sendiri, tiada fallback diperlukan
          if (shareErr instanceof DOMException && shareErr.name === 'AbortError') {
            return;
          }
          // OS reject perkongsian langsung, fallback ke muat turun
          onDownloadClip(clip);
          setShareNotice('Telefon menolak perkongsian terus. Fail dimuat turun sebagai fallback.');
          return;
        }
      }

      // Fallback untuk desktop / pelayar tanpa sokongan share fail
      onDownloadClip(clip);
      setShareNotice('Fail dimuat turun. Buka WhatsApp dan pilih klip ini secara manual.');
    } catch (err) {
      console.warn('Ralat perkongsian:', err);
      onDownloadClip(clip);
      setShareNotice('Fail dimuat turun ke peranti anda.');
    } finally {
      setSharingIndex(null);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/25 bg-zinc-900/80 p-5 space-y-4 backdrop-blur-md shadow-2xl">
      {/* Banner Selesai */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Video Selesai Dioptimumkan!
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            H.264 High Profile, sedia dimuat naik tanpa kabur atau pecah.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition py-1.5 px-3 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className="w-3 h-3" /> Baru
        </button>
      </div>

      {/* Makluman Share jika ada */}
      {shareNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <p>{shareNotice}</p>
          </div>
          <button
            onClick={() => setShareNotice(null)}
            className="text-zinc-400 hover:text-zinc-200 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Senarai Klip */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {clips.map((clip) => (
          <div
            key={clip.index}
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/70 border border-white/5 hover:border-white/10 transition shadow-sm"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs flex-shrink-0 shadow-sm">
                #{clip.index}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1">
                  <Film className="w-3 h-3 text-zinc-400" />
                  Klip {clip.index} ({Math.round(clip.duration)}s)
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {clip.sizeMb.toFixed(1)} MB • H.264 30fps
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Share terus ke WhatsApp Status */}
              <button
                onClick={() => handleShareToWhatsApp(clip)}
                disabled={sharingIndex === clip.index}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold transition active:scale-95 shadow-sm"
                title="Kongsi terus ke WhatsApp Status"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Status</span>
              </button>

              {/* Muat turun klip */}
              <button
                onClick={() => onDownloadClip(clip)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition active:scale-95"
                title="Muat Turun Fail MP4"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Butang Muat Turun Semua */}
      <button
        onClick={onDownloadAll}
        className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:brightness-110 text-zinc-950 font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.3)] transition active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        Muat Turun Semua Bahagian ({clips.length} Klip)
      </button>
    </div>
  );
};
