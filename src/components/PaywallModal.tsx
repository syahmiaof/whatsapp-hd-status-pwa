import React, { useState } from 'react';
import { X, Check, QrCode, ArrowRight } from 'lucide-react';
import { getDeviceId } from '../lib/trialManager';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateKey: (key: string) => boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onActivateKey }) => {
  const [activationKey, setActivationKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const referenceCode = getDeviceId();

  if (!isOpen) return null;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey.trim()) return;
    const success = onActivateKey(activationKey.trim());
    if (success) {
      onClose();
    } else {
      setKeyError('Kunci VIP tidak sah. Sila semak semula atau hubungi admin.');
    }
  };

  const whatsappLink = `https://wa.me/601123456789?text=${encodeURIComponent(
    `Hai Admin StatusHD, saya nak langgan VIP RM9/bulan.\nKod Peranti: ${referenceCode}\n(Saya lampirkan resit DuitNow)`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Butang Tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Paywall */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <QrCode className="w-3.5 h-3.5" />
            <span>Pakej Rakan Sekelas</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
            StatusHD VIP
          </h2>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-black text-emerald-400">RM9</span>
            <span className="text-xs text-zinc-400 font-semibold">/ sebulan</span>
          </div>
          <p className="text-xs text-zinc-400">Jauh lebih murah daripada PureStatus (RM49/thn)!</p>
        </div>

        {/* Kelebihan */}
        <div className="space-y-2 text-xs text-zinc-300 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            Kualiti Ultra HD 1080p tanpa pecah
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            Auto-split 30 saat tanpa had video
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            100% proses atas telefon (laju & privasi)
          </div>
        </div>

        {/* DuitNow QR Box */}
        <div className="text-center space-y-2.5">
          <p className="text-xs font-semibold text-zinc-300">Imbas DuitNow QR untuk bayaran:</p>
          <div className="mx-auto w-36 h-36 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-lg shadow-white/5">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DUITNOW-STATUSHD-${referenceCode}`}
              alt="DuitNow QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[11px] font-mono text-zinc-400">
            ID Rujukan: <span className="text-emerald-400 font-bold">{referenceCode}</span>
          </p>
        </div>

        {/* Butang WhatsApp Pengesahan */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-[#25D366]/25"
        >
          <span>Hantar Bukti Pembayaran ke WhatsApp</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>

        {/* Input Kunci Pengaktifan */}
        <form onSubmit={handleKeySubmit} className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-[11px] text-zinc-400 block text-center font-medium">
            Ada kunci pengaktifan atau kod VIP?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: HD-A8F2K9M1-C4E2 atau BOSSKITA"
              value={activationKey}
              onChange={(e) => {
                setActivationKey(e.target.value);
                setKeyError('');
              }}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition active:scale-95"
            >
              Aktif
            </button>
          </div>
          {keyError && <p className="text-[11px] text-rose-400 text-center font-medium">{keyError}</p>}
        </form>
      </div>
    </div>
  );
};
