import React, { useState } from 'react';
import { BASIC_PH_IMAGE_DATA_URI } from '../data/basicPhData';
import { Maximize2, X, ZoomIn, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface BasicPhReferenceBoxProps {
  activeChannel?: string;
  onSelectChannel?: (channel: string) => void;
}

export const BasicPhReferenceBox: React.FC<BasicPhReferenceBoxProps> = ({
  activeChannel,
  onSelectChannel,
}) => {
  // Use the exact uploaded BASIC-Ph.png (491KB high-resolution file)
  const [imgSrc, setImgSrc] = useState<string>(BASIC_PH_IMAGE_DATA_URI || '/BASIC-Ph.png');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleImgError = () => {
    if (imgSrc !== '/BASIC-Ph.png') {
      setImgSrc('/BASIC-Ph.png');
    } else if (imgSrc !== BASIC_PH_IMAGE_DATA_URI) {
      setImgSrc(BASIC_PH_IMAGE_DATA_URI);
    }
  };

  return (
    <>
      {/* Embedded Reference Card inside Activity 3 Brainstorming Box */}
      <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-3 sm:p-4 shadow-xs space-y-2.5 transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-amber-100 text-amber-900">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                B.A.S.I.C. Ph Coping Strategies Guide
              </h5>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                Refer to this visual infographic for coping ideas &amp; examples
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-2xs"
              title="Open full chart in zoom view"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Zoom Chart</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={isCollapsed ? 'Expand image' : 'Collapse image'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        {!isCollapsed && (
          <div className="relative group">
            <div
              onClick={() => setShowModal(true)}
              className="relative w-full max-h-[300px] sm:max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 cursor-pointer overflow-hidden group-hover:border-amber-400 transition"
              title="Tap to zoom in full resolution"
            >
              <img
                src={imgSrc}
                alt="B.A.S.I.C. PH Coping Strategies Infographic"
                onError={handleImgError}
                className="w-full h-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.01]"
                referrerPolicy="no-referrer"
                loading="eager"
              />

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-md">
                  <ZoomIn className="w-3.5 h-3.5" /> Tap to Open Full Chart
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
              <span>Tip: Tap on the infographic to view full-screen on your iPad</span>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-amber-700 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Full View</span> &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Zoom Modal (Especially handy on iPad and phone screens) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-6 animate-fadeIn">
          {/* Modal Header */}
          <div className="w-full max-w-4xl bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="font-extrabold text-sm sm:text-base text-white">
                B.A.S.I.C. PH Coping Strategies • Reference Chart
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body with Scrollable High-Res Image */}
          <div className="w-full max-w-4xl max-h-[82vh] bg-white rounded-b-2xl overflow-y-auto p-2 sm:p-4 shadow-2xl border-x border-b border-slate-800">
            <img
              src={imgSrc}
              alt="B.A.S.I.C. PH Coping Strategies Full Infographic"
              onError={handleImgError}
              className="w-full h-auto object-contain mx-auto select-none rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Modal Footer */}
          <div className="w-full max-w-4xl pt-3 flex items-center justify-between text-xs text-slate-300 px-2">
            <span>Scroll up and down to view all 6 coping channels and examples</span>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm"
            >
              Back to Activity 3
            </button>
          </div>
        </div>
      )}
    </>
  );
};
