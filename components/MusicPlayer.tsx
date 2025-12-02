
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
        audioRef.current.loop = true; // Ensure loop is set programmatically
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
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-slate-900 font-hand font-bold text-lg hover:translate-y-0.5 hover:shadow-none transition-all mt-4"
          >
            <Plus size={18} strokeWidth={3} /> Add Our Song
            <input type="file" ref={fileRef} accept="audio/*" className="hidden" onChange={handleFile} />
          </button>
      );
  }

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mt-4 animate-fade-in transform -rotate-1">
      <audio ref={audioRef} src={src} loop />
      
      <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center bg-yellow-400 border-2 border-slate-900 text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-transform">
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Frequency Visualizer Animation */}
      <div className="flex items-center gap-[3px] h-6 w-20 justify-center">
          {[...Array(6)].map((_, i) => (
             <div 
                key={i} 
                className={`w-1.5 bg-slate-900 rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-1.5'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
             ></div>
          ))}
      </div>

      <button onClick={onRemove} className="text-slate-400 hover:text-rose-500 transition-colors ml-1">
        <Trash2 size={16} />
      </button>

      <style>{`
        @keyframes music-bar {
            0%, 100% { height: 4px; }
            50% { height: 20px; }
        }
        .animate-music-bar {
            animation: music-bar 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
