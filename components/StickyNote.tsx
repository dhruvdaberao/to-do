
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

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    onMouseDown(e);
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
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
    >
      <div className="relative w-[400px] h-[300px] bg-[#fef9c3] shadow-[2px_4px_12px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden transition-shadow hover:shadow-xl">
        
        {/* Punched Holes */}
        <div className="absolute top-4 left-6 right-6 flex justify-between pointer-events-none z-10">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-[#3d3d3d]/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]"></div>
            ))}
        </div>

        {/* Content */}
        <div className="relative pt-16 px-10 pb-12 h-full flex flex-col font-hand text-slate-800 text-xl leading-[36px]">
             {children}
        </div>

        {/* Edit Button */}
        <button
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                absolute bottom-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-black/5 transition-all
                ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            title="Edit List"
        >
            <Edit3 size={24} />
        </button>

        {/* Handles */}
        <div 
            className={`
                absolute bottom-3 left-3 bg-white/90 text-slate-800 rounded-full p-2 shadow-md border border-slate-200 cursor-nwse-resize
                transition-all duration-200 z-30 hover:bg-yellow-200 hover:scale-110 active:scale-95
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            onMouseDown={(e) => stopProp(e, onResizeStart)}
            onTouchStart={(e) => stopProp(e, onResizeStart)}
            title="Resize"
        >
            <Scaling size={18} strokeWidth={2.5} />
        </div>

        <div 
            className={`
                absolute top-3 right-3 bg-white/90 text-slate-800 rounded-full p-2 shadow-md border border-slate-200 cursor-alias
                transition-all duration-200 z-30 hover:bg-sky-200 hover:scale-110 active:scale-95
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            onMouseDown={(e) => stopProp(e, onRotateStart)}
            onTouchStart={(e) => stopProp(e, onRotateStart)}
            title="Rotate"
        >
            <RotateCw size={18} strokeWidth={2.5} />
        </div>

      </div>
    </div>
  );
};

export default StickyNote;
