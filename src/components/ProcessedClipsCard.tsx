import React, { useState } from 'react';
import { TranscodeClipResult } from '../types/optimizer';
import { Download, Share2, Sparkles, RefreshCw, Film, Info, Check, ArrowRight } from 'lucide-react';
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
  const [showForwardTip, setShowForwardTip] = useState(false);

  React.useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#14b8a6', '#25D366']
    });
  }, []);

  const handleShareToWhatsApp = async (clip: TranscodeClipResult) => {
    setSharingIndex(clip.index);
    setShareNotice(null);

    try {
      const file = new File([clip.blob], clip.filename, { type: 'video/mp4' });

      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `StatusHD (${clip.filename})`,
            text: 'Status HD 1080p',
          });
          setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
          return;
        } catch (shareErr: any) {
          if (shareErr instanceof DOMException && shareErr.name === 'AbortError') {
            return;
          }
          onDownloadClip(clip);
          setShareNotice('Fail disimpan ke galeri telefon.');
          setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
          return;
        }
      }

      onDownloadClip(clip);
      setShareNotice('Fail disimpan ke telefon. Buka WhatsApp dan pilih klip ini.');
      setSentClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
    } catch (err) {
      console.warn('Ralat share:', err);
      onDownloadClip(clip);
    } finally {
      setSharingIndex(null);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-zinc-900/70 p-4 space-y-3.5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-zinc-100 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Klip Siap ({clips.length} Bahagian)</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-white transition py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Baru
        </button>
      </div>

      {/* Tip Penting (1 Ayat Sahaja) */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-2">
        <p className="text-[11px] leading-tight">
          ⚠️ <strong>Jangan edit/trim dalam WhatsApp</strong> — terus tekan Send supaya kekal 1080p.
        </p>
        <button
          onClick={() => setShowForwardTip(!showForwardTip)}
          className="text-[10px] text-amber-400 font-bold underline whitespace-nowrap"
        >
          {showForwardTip ? 'Tutup' : 'Trik Forward?'}
        </button>
      </div>

      {/* Trik Rahsia Forwarding (Collapsible) */}
      {showForwardTip && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-[11px] space-y-1 animate-fade-in leading-relaxed">
          <p className="font-bold text-emerald-300">💡 Rahsia WhatsApp Tak Compress Langsung:</p>
          <p>
            Hantar video ini ke chat sendiri (Message Yourself) atau kawan. Dari chat itu, tekan butang <strong>Forward (➡️) ke My Status</strong>. WhatsApp tidak pernah memampatkan video yang diforward!
          </p>
        </div>
      )}

      {/* Notis share fallback */}
      {shareNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <span className="text-[11px]">{shareNotice}</span>
          <button onClick={() => setShareNotice(null)} className="text-zinc-400 text-xs px-1">✕</button>
        </div>
      )}

      {/* Senarai Klip (Clean & Simple) */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
        {clips.map((clip) => {
          const isSent = sentClips.includes(clip.index);

          return (
            <div
              key={clip.index}
              className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                isSent
                  ? 'bg-zinc-950/40 border-emerald-500/20 opacity-75'
                  : 'bg-zinc-950/70 border-white/5 hover:border-white/10'
              }`}
            >
              {/* Info Klip */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  isSent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {isSent ? <Check className="w-4 h-4 stroke-[3]" /> : clip.index}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200 truncate">
                    Bahagian {clip.index}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {Math.round(clip.duration)}s • {clip.sizeMb.toFixed(1)} MB
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleShareToWhatsApp(clip)}
                  disabled={sharingIndex === clip.index}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                    isSent
                      ? 'bg-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 font-black'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isSent ? 'Hantar Lagi' : 'WhatsApp'}</span>
                </button>

                <button
                  onClick={() => onDownloadClip(clip)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title="Simpan Fail"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Download Semua (Discreet) */}
      <div className="pt-1 flex items-center justify-between text-xs text-zinc-400">
        <button
          onClick={onDownloadAll}
          className="hover:text-zinc-200 transition text-[11px] font-medium flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          <span>Simpan semua fail ke telefon</span>
        </button>
      </div>
    </div>
  );
};
