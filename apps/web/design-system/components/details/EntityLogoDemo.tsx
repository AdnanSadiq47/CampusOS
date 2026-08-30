import React from 'react';

export function EntityLogoDemo() {
  return (
    <div className="p-6 space-y-6 text-center">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Entity Logo & Placeholder Standard Sizes
      </h4>
      <div className="flex items-center justify-center gap-8">
        {/* 64px Hero */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm border border-indigo-700">
            🏫
          </div>
          <span className="text-[10px] font-semibold text-slate-500">64px Hero</span>
        </div>

        {/* 40px Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
            🏢
          </div>
          <span className="text-[10px] font-semibold text-slate-500">40px Card</span>
        </div>

        {/* 28px Inline */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🌐
          </div>
          <span className="text-[10px] font-semibold text-slate-500">28px Inline</span>
        </div>
      </div>
    </div>
  );
}
