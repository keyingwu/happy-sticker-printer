import React from 'react';

interface PrinterProps {
  loading: boolean;
  children?: React.ReactNode;
  freshSticker: { url: string, prompt: string } | null;
  onStartDragFresh: (e: React.MouseEvent | React.TouchEvent) => void;
  onDownloadFresh: () => void;
}

export const Printer: React.FC<PrinterProps> = ({ loading, children, freshSticker, onStartDragFresh, onDownloadFresh }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto z-50 select-none pointer-events-auto">

      {/* Outer Container with Ground Shadow */}
      <div
        className="relative"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
        }}
      >
        {/* Printer Body Shell */}
        <div className="relative z-20 overflow-hidden rounded-2xl">

          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-500/30 to-transparent z-30" />

          {/* Dark Top Panel - Status & Branding */}
          <div className="bg-gradient-to-b from-slate-700 to-slate-800 px-5 py-4">
            <div className="flex items-center justify-between">
              {/* Status LED */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  {/* LED Glow */}
                  <div
                    className={`absolute inset-0 rounded-full blur-sm ${loading ? 'bg-amber-400/60' : 'bg-emerald-500/50'}`}
                    style={{ transform: 'scale(1.5)' }}
                  />
                  {/* LED Body */}
                  <div
                    className={`relative w-3 h-3 rounded-full border border-white/20 ${
                      loading
                        ? 'bg-gradient-to-br from-amber-300 to-amber-500 animate-pulse'
                        : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                    }`}
                  >
                    {/* LED Reflection */}
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/60 rounded-full" />
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 tracking-widest font-semibold uppercase">
                  {loading ? 'Printing...' : 'Ready'}
                </span>
              </div>

              {/* Branding */}
              <div className="flex items-center gap-3">
                <span
                  className="text-slate-500 font-black text-lg tracking-tight"
                  style={{
                    textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  STICKER-MATIC
                </span>

                {/* Decorative Vents */}
                <div className="flex gap-[3px]">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[2px] h-4 bg-slate-600 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* White Front Panel - Input Area */}
          <div className="relative bg-slate-800 px-3 pb-3">
            {/* Recessed White Panel */}
            <div
              className="bg-gradient-to-b from-slate-50 to-white rounded-lg p-5"
              style={{
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)'
              }}
            >
              {children}
            </div>
          </div>

          {/* Paper Slot Section */}
          <div className="bg-slate-800 px-3 pb-2">
            {/* Metal Guide Rails + Dark Slot */}
            <div className="relative flex items-stretch h-5 rounded-b-lg overflow-hidden">
              {/* Left Rail */}
              <div
                className="w-3 bg-gradient-to-b from-slate-400 to-slate-500 rounded-bl-lg"
                style={{ boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.2)' }}
              />

              {/* Center Slot (Dark Void) */}
              <div
                className="flex-1 bg-gradient-to-b from-slate-950 to-black relative"
                style={{ boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.5)' }}
              >
                {/* Subtle roller texture */}
                <div className="absolute inset-x-4 top-1 h-[2px] bg-slate-800 rounded-full opacity-50" />
                <div className="absolute inset-x-8 top-2.5 h-[2px] bg-slate-800 rounded-full opacity-30" />
              </div>

              {/* Right Rail */}
              <div
                className="w-3 bg-gradient-to-b from-slate-400 to-slate-500 rounded-br-lg"
                style={{ boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.2)' }}
              />
            </div>
          </div>

          {/* Bottom Edge / Base */}
          <div className="h-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-2xl" />

        </div>
      </div>

      {/* Sticker Output Area - Emerges from paper slot */}
      <div className="relative z-10 flex justify-center -mt-6 overflow-hidden pt-6 pb-8 px-8">
        {freshSticker && (
          <div
            className="relative cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform origin-top group"
            onMouseDown={onStartDragFresh}
            onTouchStart={onStartDragFresh}
            style={{
              animation: 'print-emerge 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
            }}
          >
            {/* The Sticker */}
            <img
              src={freshSticker.url}
              alt="Fresh Sticker"
              className="w-64 h-64 object-contain pointer-events-none select-none"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
              }}
              draggable={false}
            />

            {/* Drag Hint */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center animate-bounce">
              <span className="text-[10px] text-slate-400 font-mono bg-white/95 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                DRAG ME
              </span>
            </div>

            {/* Quick Download Button */}
            <button
              className="absolute top-4 right-4 w-9 h-9 bg-white/95 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Download Now"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDownloadFresh();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9v6m0 0 3-3m-3 3-3-3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes print-emerge {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
