import React from 'react';
import { Sparkles, Crown, Zap } from 'lucide-react';

interface HeaderProps {
  trialDaysLeft: number;
  isSubscribed: boolean;
  onOpenPaywall: () => void;
}

export const Header: React.FC<HeaderProps> = ({ trialDaysLeft, isSubscribed, onOpenPaywall }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-300 p-[1.5px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <span className="text-emerald-400 font-black text-sm tracking-tighter">HD</span>
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-zinc-100 tracking-tight flex items-center gap-1.5">
              StatusHD
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> PRO
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">WhatsApp Anti-Blur & Auto 30s Splitter</p>
          </div>
        </div>

        {/* Trial Badge / VIP Button */}
        <div>
          {isSubscribed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-emerald-400" />
              <span>VIP Unlimited</span>
            </div>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{trialDaysLeft > 0 ? `${trialDaysLeft} Hari Trial` : 'Unlock RM9'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
