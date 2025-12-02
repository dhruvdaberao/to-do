
import React, { useState } from 'react';
import { Scaling, RotateCw, Edit3 } from 'lucide-react';

export interface NoteData {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface StickyNoteProps {
  data: NoteData;
  onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onClick: () => void;
  children: React.ReactNode;
}

const StickyNote: React.FC<StickyNoteProps> = ({ 
  data, 
  onMouseDown, 
  onResizeStart, 
  onRotateStart, 
  onClick, 
  children 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const style: React.CSSProperties = {
    position: 'relative', 
    transform: `translate3d(${data.x}px, ${data.y}px, 0) rotate(${data.rotation}deg) scale(${data.scale})`,
    zIndex: 15,
    touchAction: 'none',
  };

  const stopProp = (e: React.MouseEvent | React.TouchEvent, cb: (e:any)=>void) => {
      e.stopPropagation();
      cb(e);
  };

  return (
    <div 
        id="bucket-list"
        style={style}
        className="group cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
    >
      {/* Changed h-[auto] and min-h-[auto] to allow growth */}
      <div className="relative w-[340px] sm:w-[400px] h-auto min-h-[200px] bg-[#fef9c3] shadow-[2px_4px_12px_rgba(0,0,0,0.1)] rounded-sm overflow-visible transition-shadow hover:shadow-xl pb-12">
        
        {/* Punched Holes */}
        <div className="absolute top-4 left-6 right-6 flex justify-between pointer-events-none z-10">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#3d3d3d]/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]"></div>
            ))}
        </div>

        {/* Content */}
        <div className="relative pt-14 px-8 sm:px-10 pb-4 h-full flex flex-col font-hand text-slate-800 text-xl sm:text-2xl font-bold leading-[30px] sm:leading-[36px]">
             {children}
        </div>

        {/* Quirky Pop Edit Button */}
        <button
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                absolute bottom-4 right-4 bg-yellow-400 text-slate-900 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none transition-all z-20
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 sm:opacity-0'}
            `}
            title="Edit List"
        >
            <Edit3 size={24} strokeWidth={2.5} />
        </button>

        {/* Handles */}
        <div 
            className={`
                absolute bottom-3 left-3 bg-white/90 text-slate-800 rounded-full p-2 shadow-md border border-slate-200 cursor-nwse-resize
                transition-all duration-200 z-30 hover:bg-yellow-200 hover:scale-110 active:scale-95
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 sm:opacity-0'}
            `}
            onMouseDown={(e) => stopProp(e, onResizeStart)}
            onTouchStart={(e) => stopProp(e, onResizeStart)}
        >
            <Scaling size={18} strokeWidth={2.5} />
        </div>

        <div 
            className={`
                absolute top-3 right-3 bg-white/90 text-slate-800 rounded-full p-2 shadow-md border border-slate-200 cursor-alias
                transition-all duration-200 z-30 hover:bg-sky-200 hover:scale-110 active:scale-95
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 sm:opacity-0'}
            `}
            onMouseDown={(e) => stopProp(e, onRotateStart)}
            onTouchStart={(e) => stopProp(e, onRotateStart)}
        >
            <RotateCw size={18} strokeWidth={2.5} />
        </div>

      </div>
    </div>
  );
};

export default StickyNote;
