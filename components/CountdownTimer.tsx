
import React from 'react';
import { TimeLeft } from '../utils/time';

interface CountdownTimerProps {
  timeLeft: TimeLeft;
}

const TimeUnit: React.FC<{ value: number; label: string; rotate?: string }> = ({ value, label, rotate = 'rotate-0' }) => (
  <div className={`flex flex-col items-center mx-0.5 sm:mx-2 transform ${rotate} shrink-0`}>
    <div className="relative">
        {/* Force huge text, adjust per screen */}
        <div className="text-[11vw] sm:text-7xl md:text-8xl font-marker text-slate-800 tabular-nums tracking-wide drop-shadow-sm leading-none">
        {String(value).padStart(2, '0')}
        </div>
        <svg className="absolute -bottom-1 left-0 w-full h-1 sm:h-2 text-yellow-300/50 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" />
        </svg>
    </div>
    <span className="text-[2.5vw] sm:text-sm md:text-xl font-hand text-slate-600 font-bold mt-1 sm:mt-2 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeLeft }) => {
  return (
    <div className="flex flex-nowrap justify-center items-center py-4 sm:py-8 px-2 bg-white/40 backdrop-blur-sm rounded-xl border-2 border-slate-800/5 shadow-sm transform -rotate-1 w-full overflow-hidden whitespace-nowrap mx-auto">
      <TimeUnit value={timeLeft.days} label="Days" rotate="-rotate-2" />
      <span className="text-[8vw] sm:text-6xl md:text-7xl font-marker text-slate-400 -mt-2 sm:-mt-8 px-0.5">:</span>
      <TimeUnit value={timeLeft.hours} label="Hours" rotate="rotate-1" />
      <span className="text-[8vw] sm:text-6xl md:text-7xl font-marker text-slate-400 -mt-2 sm:-mt-8 px-0.5">:</span>
      <TimeUnit value={timeLeft.minutes} label="Mins" rotate="-rotate-1" />
      <span className="text-[8vw] sm:text-6xl md:text-7xl font-marker text-slate-400 -mt-2 sm:-mt-8 px-0.5">:</span>
      <TimeUnit value={timeLeft.seconds} label="Secs" rotate="rotate-2" />
    </div>
  );
};

export default CountdownTimer;
