
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Music, Trash2, Plus } from 'lucide-react';

interface MusicPlayerProps {
  src: string;
  onUpload: (base64: string) => void;
  onRemove: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ src, onUpload, onRemove }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current && src) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Max 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            onUpload(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  if (!src) {
      return (
          <button 
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 text-slate-500 font-hand font-bold text-sm hover:bg-white hover:text-slate-900 transition-all mt-2"
          >
            <Plus size={14} /> Add Song
            <input type="file" ref={fileRef} accept="audio/*" className="hidden" onChange={handleFile} />
          </button>
      );
  }

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm mt-2 animate-fade-in">
      <audio ref={audioRef} src={src} loop onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
      
      <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full hover:scale-105 active:scale-95 transition-transform">
        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Frequency Visualizer Animation */}
      <div className="flex items-center gap-[2px] h-4 w-16 justify-center">
          {[...Array(5)].map((_, i) => (
             <div 
                key={i} 
                className={`w-1 bg-slate-800 rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-1'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
             ></div>
          ))}
      </div>

      <button onClick={onRemove} className="text-slate-400 hover:text-rose-500 transition-colors">
        <Trash2 size={14} />
      </button>

      <style>{`
        @keyframes music-bar {
            0%, 100% { height: 4px; }
            50% { height: 16px; }
        }
        .animate-music-bar {
            animation: music-bar 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
