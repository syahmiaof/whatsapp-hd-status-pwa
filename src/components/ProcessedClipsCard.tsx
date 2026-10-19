import React, { useState } from 'react';
import { TranscodeClipResult } from '../types/optimizer';
import { Download, Share2, Sparkles, RefreshCw, Check, Info, X, Play, Eye } from 'lucide-react';
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
  const [sharedClips, setSharedClips] = useState<number[]>([]);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [showForwardTip, setShowForwardTip] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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
          await navigator.share({ files: [file] });
          setSharedClips((prev) => (prev.includes(clip.index) ? prev : [...prev, clip.index]));
          setShareNotice('Share sheet ditutup. StatusHD tak boleh sahkan sama ada video sudah dihantar.');
          return;
        } catch (shareErr: any) {
          if (shareErr instanceof DOMException && shareErr.name === 'AbortError') {
            return;
          }
          onDownloadClip(clip);
          setShareNotice('Share tak tersedia. Fail dimuat turun; buka WhatsApp dan pilih fail ini dari Galeri.');
          return;
        }
      }

      onDownloadClip(clip);
      setShareNotice('Share fail tak disokong pada browser ini. Fail dimuat turun ke telefon.');
    } catch (err) {
      console.warn('Ralat share:', err);
      onDownloadClip(clip);
      setShareNotice('Gagal membuka share sheet. Fail dimuat turun ke telefon.');
    } finally {
      setSharingIndex(null);
    }
  };

  return (
    <div className="space-y-3.5 rounded-3xl border border-[#e1e9e2] bg-white p-4 shadow-[0_10px_28px_rgba(23,32,25,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#edf0ed] pb-2.5">
        <div className="flex items-center gap-1.5 text-sm font-bold text-[#202a22]">
          <Sparkles className="h-4 w-4 text-[#168347]" />
          <span>Klip Siap ({clips.length} Bahagian)</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 rounded-lg bg-[#f1f5f1] px-2.5 py-1 text-xs text-[#59665b] transition hover:bg-[#e7eee8] hover:text-[#263429] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <RefreshCw className="w-3 h-3" /> Baru
        </button>
      </div>

      {/* Cara hantar ke Status */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#e6ebe6] bg-[#f7f9f7] p-2.5 text-xs text-[#526055]">
        <div className="flex min-w-0 items-start gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#657067]" />
          <p className="text-[11px] leading-snug">
            Preview dulu. Kalau dah kabur di sini, masalah pada fail output. Kalau tajam, WhatsApp mungkin encode semula masa dihantar sebagai video.
          </p>
        </div>
        <button
          onClick={() => setShowForwardTip(!showForwardTip)}
          className="whitespace-nowrap text-[10px] font-bold text-[#176b3b] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          {showForwardTip ? 'Tutup' : 'Cara terbaik?'}
        </button>
      </div>

      {/* Panduan WhatsApp yang jujur */}
      {showForwardTip && (
        <div className="animate-fade-in space-y-1 rounded-xl border border-[#dfe9e1] bg-[#f1f8f2] p-3 text-[11px] leading-relaxed text-[#3d5142]">
            <p className="font-bold text-[#176b3b]">Semak kualiti:</p>
          <p>
            Bandingkan video di preview ini dengan video selepas dihantar. WhatsApp boleh memampatkan media; StatusHD tak dapat kawal pemprosesan WhatsApp. Share sheet juga mungkin minta kau pilih WhatsApp secara manual.
          </p>
        </div>
      )}

      {/* Notis share fallback */}
      {shareNotice && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-[#dfe9e1] bg-[#f1f8f2] p-2.5 text-xs text-[#34503c]">
          <span className="text-[11px]">{shareNotice}</span>
          <button onClick={() => setShareNotice(null)} aria-label="Tutup notis" className="px-1 text-[#66746a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Senarai Klip (Clean & Simple) */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
        {clips.map((clip) => {
          const isShared = sharedClips.includes(clip.index);

          return (
            <div key={clip.index} className={`rounded-2xl border p-3 transition ${
                isShared
                ? 'border-[#d8e9dc] bg-[#f5faf6]'
                : 'border-[#e9ede9] bg-white hover:border-[#cbd9cd]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                {/* Info Klip */}
                <div className="flex min-w-0 items-center space-x-2.5">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isShared ? 'bg-[#e3f4e7] text-[#168347]' : 'bg-[#f0f3f0] text-[#49564c]'
                }`}>
                  {isShared ? <Check className="w-4 h-4 stroke-[3]" /> : clip.index}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#263129]">
                    Bahagian {clip.index}
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-[#768078]">
                    {Math.round(clip.duration)}s • {clip.sizeMb.toFixed(1)} MB
                  </p>
                </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewIndex(previewIndex === clip.index ? null : clip.index)}
                  aria-expanded={previewIndex === clip.index}
                  className="flex min-h-9 items-center gap-1 rounded-xl bg-[#f0f3f0] px-2.5 text-xs font-semibold text-[#455247] transition hover:bg-[#e7eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  {previewIndex === clip.index ? <Eye className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{previewIndex === clip.index ? 'Tutup' : 'Preview'}</span>
                </button>
                <button
                  onClick={() => handleShareToWhatsApp(clip)}
                  disabled={sharingIndex === clip.index}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                    isShared
                    ? 'bg-[#f0f3f0] text-[#455247] hover:bg-[#e7eee8]'
                    : 'bg-[#168347] text-white hover:bg-[#0e773f]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isShared ? 'Buka Lagi' : 'WhatsApp'}</span>
                </button>

                <button
                  onClick={() => onDownloadClip(clip)}
                  className="rounded-xl bg-[#f0f3f0] p-2 text-[#5f6b61] transition hover:bg-[#e7eee8] hover:text-[#263429] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  title="Simpan Fail"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              </div>
              {previewIndex === clip.index && (
                <video
                  key={clip.downloadUrl}
                  src={clip.downloadUrl}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`Preview Bahagian ${clip.index}`}
                  className="mt-3 max-h-[55vh] w-full rounded-xl bg-black object-contain"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Download Semua (Discreet) */}
      <div className="flex items-center justify-between pt-1 text-xs text-[#68746a]">
        <button
          onClick={onDownloadAll}
          className="flex items-center gap-1 text-[11px] font-medium transition hover:text-[#263429] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Download className="w-3 h-3" />
          <span>Simpan semua fail ke telefon</span>
        </button>
      </div>
    </div>
  );
};
