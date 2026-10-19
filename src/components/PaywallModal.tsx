import React, { useState } from 'react';
import { ArrowRight, Check, Crown, X } from 'lucide-react';
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

  const handleKeySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activationKey.trim()) return;
    if (onActivateKey(activationKey.trim())) {
      onClose();
      return;
    }
    setKeyError('Kunci tak sah. Semak semula atau minta bantuan admin.');
  };

  const whatsappLink = `https://wa.me/601123456789?text=${encodeURIComponent(
    `Hai Admin StatusHD, saya nak aktifkan StatusHD VIP RM5/bulan.\nID rujukan: ${referenceCode}\nBoleh beri cara bayaran DuitNow dan kunci VIP?`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#152018]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-[#e6ebe6] bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_18px_60px_rgba(14,30,18,0.2)] sm:rounded-[28px] sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f5f2] text-[#59665b] transition hover:bg-[#e7eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f7ed] px-3 py-1.5 text-xs font-semibold text-[#176b3b]">
            <Crown className="h-3.5 w-3.5" /> StatusHD VIP
          </span>
          <h2 id="paywall-title" className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#172019]">
            Teruskan guna StatusHD
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#657067]">
            {trialDaysMessage()}
          </p>

          <div className="mt-5 flex items-baseline gap-1.5 border-b border-[#edf0ed] pb-5">
            <span className="text-4xl font-extrabold tracking-[-0.04em] text-[#168347]">RM5</span>
            <span className="text-sm font-medium text-[#657067]">/ bulan</span>
          </div>

          <ul className="mt-5 space-y-3 text-sm text-[#344238]">
            <li className="flex items-center gap-2.5"><Check className="h-4 w-4 flex-shrink-0 text-[#168347]" /> Output sehingga 1080p</li>
            <li className="flex items-center gap-2.5"><Check className="h-4 w-4 flex-shrink-0 text-[#168347]" /> Auto-split video setiap 30 saat</li>
            <li className="flex items-center gap-2.5"><Check className="h-4 w-4 flex-shrink-0 text-[#168347]" /> Video diproses terus dalam telefon</li>
          </ul>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#168347] px-4 text-sm font-bold text-white transition hover:bg-[#0e773f] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            Minta cara bayaran DuitNow <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-2 text-center text-xs leading-5 text-[#778178]">
            Bayaran manual. Admin beri kunci VIP selepas pengesahan; tiada caj automatik.
          </p>

          <form onSubmit={handleKeySubmit} className="mt-5 border-t border-[#edf0ed] pt-4">
            <label htmlFor="activation-key" className="text-xs font-semibold text-[#48554a]">
              Dah ada kunci VIP?
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="activation-key"
                type="text"
                autoComplete="off"
                placeholder="Masukkan kunci VIP"
                value={activationKey}
                onChange={(event) => {
                  setActivationKey(event.target.value);
                  setKeyError('');
                }}
                className="min-w-0 flex-1 rounded-xl border border-[#dce4dd] bg-white px-3 py-2.5 text-sm text-[#202a22] placeholder:text-[#929b93] focus:border-[#168347] focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <button type="submit" className="rounded-xl bg-[#f0f3f0] px-4 text-sm font-semibold text-[#344238] transition hover:bg-[#e7eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                Aktifkan
              </button>
            </div>
            {keyError && <p role="alert" className="mt-2 text-xs text-rose-700">{keyError}</p>}
          </form>
        </div>
      </section>
    </div>
  );
};

function trialDaysMessage(): string {
  return 'Trial percuma 3 hari. Selepas itu, RM5 sebulan melalui bayaran manual.';
}
