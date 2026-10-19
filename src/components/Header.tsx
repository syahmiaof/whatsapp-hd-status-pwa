import React from 'react';
import { Crown, Zap } from 'lucide-react';

interface HeaderProps {
  trialDaysLeft: number;
  isSubscribed: boolean;
  onOpenPaywall: () => void;
}

export const Header: React.FC<HeaderProps> = ({ trialDaysLeft, isSubscribed, onOpenPaywall }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <span className="text-emerald-400 font-black text-xs tracking-tight">HD</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-zinc-100 tracking-tight">
              StatusHD
            </h1>
          </div>
        </div>

        {/* Trial Badge / VIP Button */}
        <div>
          {isSubscribed ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Crown className="w-3 h-3" />
              <span>VIP</span>
            </div>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition active:scale-95 shadow-sm"
            >
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span>{trialDaysLeft > 0 ? `${trialDaysLeft} Hari Percuma` : 'RM5 / bln'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
