
import React, { useState } from 'react';
import { ImageOff, Scaling, RotateCw, X } from 'lucide-react';

export interface StickerData {
  id: string;
  type: 'image';
  src: string;
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

  // Prevent dragging when clicking a handle
  const stopProp = (e: React.MouseEvent | React.TouchEvent, cb: (e: any, id: string) => void) => {
      e.stopPropagation();
      cb(e, data.id);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: data.x,
    top: data.y,
    transform: `rotate(${data.rotation}deg) scale(${data.scale})`,
    cursor: 'grab',
    touchAction: 'none',
    zIndex: 20,
    width: '100px', 
    height: '100px'
  };

  return (
    <div 
        id={data.id}
        style={style} 
        className="group"
        onMouseDown={(e) => onMouseDown(e, data.id)}
        onTouchStart={(e) => onMouseDown(e, data.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full">
        {!hasError ? (
            <img 
                src={data.src} 
                alt="sticker" 
                onError={() => setHasError(true)}
                className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none transition-transform hover:scale-105"
                draggable={false} 
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/50 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 p-2">
                <ImageOff size={24} />
            </div>
        )}
        
        {/* Handles - Visible on Hover or Interaction */}
        <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'}`}>
            
            {/* Resize Handle - Bottom Right */}
            <div 
                className="absolute -bottom-3 -right-3 bg-white text-slate-800 rounded-full p-2 shadow-md border-2 border-slate-800 cursor-nwse-resize z-30 hover:bg-yellow-200 hover:scale-110 active:scale-95"
                onMouseDown={(e) => stopProp(e, onResizeStart)}
                onTouchStart={(e) => stopProp(e, onResizeStart)}
            >
                <Scaling size={16} strokeWidth={2.5} />
            </div>

            {/* Rotate Handle - Top Right */}
            <div 
                className="absolute -top-3 -right-3 bg-white text-slate-800 rounded-full p-2 shadow-md border-2 border-slate-800 cursor-alias z-30 hover:bg-sky-200 hover:scale-110 active:scale-95"
                onMouseDown={(e) => stopProp(e, onRotateStart)}
                onTouchStart={(e) => stopProp(e, onRotateStart)}
            >
                <RotateCw size={16} strokeWidth={2.5} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default DraggableSticker;
