
import React from 'react';
import { Trash2 } from 'lucide-react';

interface TrashBinProps {
  isVisible: boolean;
  isHovered: boolean;
}

const TrashBin: React.FC<TrashBinProps> = ({ isVisible, isHovered }) => {
  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform 
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
      `}
    >
      <div className={`
        flex items-center gap-2 px-6 py-4 rounded-full shadow-xl border-4 transition-all duration-200
        ${isHovered 
            ? 'bg-rose-500 border-rose-600 scale-110 rotate-3' 
            : 'bg-white border-slate-200 text-slate-400'
        }
      `}>
         <Trash2 size={32} className={isHovered ? 'text-white animate-bounce' : ''} />
         <span className={`font-marker text-xl ${isHovered ? 'text-white' : ''}`}>
            {isHovered ? "Drop to delete!" : "Drag here to remove"}
         </span>
      </div>
    </div>
  );
};

export default TrashBin;
