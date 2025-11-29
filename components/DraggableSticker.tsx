
import React, { useState } from 'react';
import { ImageOff, Scaling, RotateCw } from 'lucide-react';

export interface StickerData {
  id: string;
  type: 'image'; // Unified type
  src: string;   // URL or base64
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface DraggableStickerProps {
  data: StickerData;
  onMouseDown: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ data, onMouseDown, onResizeStart, onRotateStart }) => {
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only trigger drag if we didn't click the resize/rotate handle (handled by propagation stop there, but safe check here)
    onMouseDown(e, data.id);
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent drag start
    onResizeStart(e, data.id);
  };

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent drag start
    onRotateStart(e, data.id);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: data.x,
    top: data.y,
    transform: `rotate(${data.rotation}deg) scale(${data.scale})`,
    cursor: 'grab',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: 20,
  };

  return (
    <div 
        id={data.id} // Added DOM ID for interaction logic
        style={style} 
        className="w-24 h-24 group"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full transition-[filter] hover:brightness-110 active:cursor-grabbing">
        {!hasError ? (
            <img 
                src={data.src} 
                alt="sticker" 
                onError={() => setHasError(true)}
                className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none"
                draggable={false} 
            />
        ) : (
            // Fallback placeholder
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/50 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 p-2">
                <ImageOff size={24} />
                <span className="text-[10px] font-mono text-center leading-tight mt-1">Missing<br/>{data.src.split('/').pop()}</span>
            </div>
        )}
        
        {/* Resize Handle - Bottom Right */}
        <div 
            className={`
                absolute -bottom-2 -right-2 bg-white text-slate-800 rounded-full p-1.5 shadow-md border-2 border-slate-800 cursor-nwse-resize
                transition-all duration-200 z-30 hover:bg-yellow-100 hover:scale-110
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 sm:opacity-0 sm:group-hover:opacity-100'}
            `}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            title="Resize"
        >
            <Scaling size={14} strokeWidth={3} />
        </div>

        {/* Rotate Handle - Top Right */}
        <div 
            className={`
                absolute -top-3 -right-3 bg-white text-slate-800 rounded-full p-1.5 shadow-md border-2 border-slate-800 cursor-alias
                transition-all duration-200 z-30 hover:bg-blue-100 hover:scale-110
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50 sm:opacity-0 sm:group-hover:opacity-100'}
            `}
            onMouseDown={handleRotateStart}
            onTouchStart={handleRotateStart}
            title="Rotate"
        >
            <RotateCw size={14} strokeWidth={3} />
        </div>

      </div>
    </div>
  );
};

export default DraggableSticker;
