
import React from 'react';

interface QuirkyBubbleProps {
  text: string;
  setText: (text: string) => void;
  color: 'red' | 'green';
  rotation: string;
}

const QuirkyBubble: React.FC<QuirkyBubbleProps> = ({ text, setText, color, rotation }) => {
  const isRed = color === 'red';
  const bgColor = isRed ? 'bg-rose-400' : 'bg-emerald-400';
  const shadowColor = isRed ? 'shadow-rose-900' : 'shadow-emerald-900';
  const placeholderText = isRed ? "Write something sweet..." : "Write a future goal...";

  return (
    <div className={`relative group w-72 sm:w-80 h-auto min-h-[140px] mx-auto transition-transform hover:scale-105 ${rotation}`}>
      
      {/* The Chat Bubble Body */}
      <div 
        className={`
          relative z-10
          ${bgColor} 
          border-4 border-slate-900 
          ${shadowColor} shadow-[6px_6px_0px_0px]
          rounded-2xl
          flex items-center justify-center p-6
        `}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          className="w-full h-24 bg-transparent border-none resize-none text-center font-marker text-white text-xl placeholder:text-white/70 focus:outline-none custom-scrollbar leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* The Tail (Triangle) */}
      <div 
        className={`
            absolute bottom-8 w-0 h-0 z-20
            border-t-[20px] border-t-transparent
            border-b-[20px] border-b-transparent
            ${isRed 
                ? '-left-5 border-r-[25px] border-r-rose-400 drop-shadow-[-4px_0px_0px_#0f172a]' // Left Tail
                : '-right-5 border-l-[25px] border-l-emerald-400 drop-shadow-[4px_0px_0px_#0f172a]' // Right Tail
            }
        `}
        style={{
            // Adjust position slightly to align with border
            filter: 'drop-shadow(0px 4px 0px #0f172a)' 
        }}
      >
        {/* Inner detail to hide the border overlap if needed, visually simple CSS triangle */}
      </div>

    </div>
  );
};

export default QuirkyBubble;
