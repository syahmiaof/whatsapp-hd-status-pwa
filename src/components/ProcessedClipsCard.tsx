import React, { useState } from 'react';
import { TranscodeClipResult } from '../types/optimizer';
import { Download, Share2, Sparkles, RefreshCw, Film, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [sentClips, setSentClips] = useState<number[]>([]);
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

      // Semak jika pelayar menyokong perkongsian fail langsung (Web Share API)
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `WhatsApp HD Status (${clip.filename})`,
            text: 'Status HD siap dipotong!',
          });
          // Tandakan sebagai telah dihantar
          setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
          return;
        } catch (shareErr: any) {
          if (shareErr instanceof DOMException && shareErr.name === 'AbortError') {
            return;
          }
          // OS tolak, muat turun terus ke telefon
          onDownloadClip(clip);
          setShareNotice('Telefon menolak perkongsian terus. Fail dimuat turun ke galeri telefon.');
          setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
          return;
        }
      }

      // Fallback untuk desktop / pelayar tanpa Web Share files
      onDownloadClip(clip);
      setShareNotice('Fail disimpan ke telefon. Buka WhatsApp dan pilih klip ini terus ke status.');
      setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
    } catch (err) {
      console.warn('Ralat perkongsian:', err);
      onDownloadClip(clip);
      setShareNotice('Fail dimuat turun ke peranti anda.');
    } finally {
      setSharingIndex(null);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/25 bg-zinc-900/90 p-5 space-y-4 backdrop-blur-md shadow-2xl">
      {/* Header Selesai */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Video Selesai ({clips.length} Bahagian)!
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kualiti Ultra HD WhatsApp Sweet-Spot sedia dihantar.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition py-1.5 px-3 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className="w-3 h-3" /> Baru
        </button>
      </div>

      {/* AMARAN EMAS PURESTATUS (Penting Supaya Video Tak Kabur) */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-300 tracking-wide uppercase text-[11px]">
            Peraturan Emas WhatsApp Status:
          </p>
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            Lepas tekan butang, WhatsApp akan terbuka. <strong>JANGAN potong, JANGAN trim, dan JANGAN letak stiker/teks</strong> dalam WhatsApp! Terus tekan butang Send/Hantar supaya kualiti HD kekal 100% tanpa di-compress.
          </p>
        </div>
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

      {/* Panduan Urutan Penghantaran */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>Hantar mengikut urutan (Klip 1 ➔ Seterusnya):</span>
        </p>
      </div>

      {/* Senarai Klip Berturutan (Macam PureStatus) */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {clips.map((clip) => {
          const isSent = sentClips.includes(clip.index);

          return (
            <div
              key={clip.index}
              className={`p-3.5 rounded-2xl border transition shadow-sm ${
                isSent
                  ? 'bg-zinc-950/40 border-emerald-500/20 opacity-80'
                  : 'bg-zinc-950/80 border-white/10 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    isSent 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-zinc-800 text-zinc-300 border border-white/10'
                  }`}>
                    {isSent ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : `#${clip.index}`}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1">
                      <Film className="w-3 h-3 text-zinc-400" />
                      Bahagian {clip.index} ({Math.round(clip.duration)}s)
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {clip.sizeMb.toFixed(1)} MB • {clip.startTime}s - {clip.endTime}s
                    </p>
                  </div>
                </div>

                {/* Butang Download Kecil untuk backup */}
                <button
                  onClick={() => onDownloadClip(clip)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition active:scale-95 text-xs flex items-center gap-1"
                  title="Simpan Fail ke Galeri"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Butang Utama Hantar Terus ke WhatsApp */}
              <button
                onClick={() => handleShareToWhatsApp(clip)}
                disabled={sharingIndex === clip.index}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md ${
                  isSent
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
                    : 'bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 font-black shadow-[#25D366]/20'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  {isSent
                    ? `Hantar Semula Bahagian ${clip.index} ke WhatsApp`
                    : `Hantar Bahagian ${clip.index} Terus ke WhatsApp Status`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Butang Muat Turun Semua (Pilihan Tambahan) */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={onDownloadAll}
          className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 border border-white/5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Simpan Semua Klip ({clips.length}) ke Telefon</span>
        </button>
      </div>
    </div>
  );
};
