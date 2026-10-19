import React from 'react';
import { Crown, Film, Zap } from 'lucide-react';

interface HeaderProps {
  trialDaysLeft: number;
  isSubscribed: boolean;
  onOpenPaywall: () => void;
}

export const Header: React.FC<HeaderProps> = ({ trialDaysLeft, isSubscribed, onOpenPaywall }) => (
  <header className="sticky top-0 z-30 border-b border-[#e8ece8] bg-white/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
    <div className="mx-auto flex w-full max-w-lg items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f7ed] text-[#137a40]">
          <Film className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#172019]">StatusHD</h1>
          <p className="text-[10px] font-medium text-[#7a847b]">Video Status Studio</p>
        </div>
      </div>

      {isSubscribed ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f7ed] px-3 py-1.5 text-xs font-semibold text-[#137a40]">
          <Crown className="h-3.5 w-3.5" /> VIP
        </span>
      ) : (
        <button
          type="button"
          onClick={onOpenPaywall}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#f2f5f2] px-3 text-xs font-semibold text-[#3b473d] transition hover:bg-[#e8eee8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Zap className="h-3.5 w-3.5 fill-current text-[#168347]" />
          {trialDaysLeft > 0 ? `${trialDaysLeft} hari trial` : 'RM5 / bulan'}
        </button>
      )}
    </div>
  </header>
);
