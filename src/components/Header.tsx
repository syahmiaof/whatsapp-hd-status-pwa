import React from 'react';
import { Film } from 'lucide-react';

export const Header: React.FC = () => (
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
      <span className="rounded-full bg-[#e9f7ed] px-3 py-1.5 text-xs font-semibold text-[#137a40]">
        Beta · Percuma
      </span>
    </div>
  </header>
);
