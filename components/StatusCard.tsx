
import React from 'react';

interface StatusCardProps {
  text: string;
  onUpdate: (text: string) => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ text, onUpdate }) => {
  return (
    <div className="w-full max-w-xs mx-auto mt-8 mb-8 text-center relative group">
       <div className="inline-block bg-[#ffedd5] border-l-4 border-[#fdba74] px-4 py-2 shadow-sm transform -rotate-1 transition-transform hover:rotate-0">
           <p className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider mb-1 text-left">Current Mood</p>
           <textarea
              value={text}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder="Type status..."
              className="bg-transparent border-none w-full text-center font-hand font-bold text-lg text-slate-800 focus:outline-none resize-none overflow-hidden placeholder:text-slate-400 placeholder:font-normal"
              rows={1}
              style={{ minHeight: '1.5em' }}
              // Simple auto-grow
              onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
           />
       </div>
    </div>
  );
};

export default StatusCard;
