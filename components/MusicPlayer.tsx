
import React, { useRef, useState, useEffect } from 'react';
import { Music, Play, Pause, Upload } from 'lucide-react';

interface MusicPlayerProps {
  src: string;
  onUpload: (base64: string) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ src, onUpload }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current && src) {
        // Auto-play if source changes (and browser allows)
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
        // Limit to 4MB for DB safety
        if (file.size > 4 * 1024 * 1024) {
            alert("Music file too large! Please use a clip under 4MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            onUpload(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto my-4 transform rotate-1 transition-transform hover:rotate-0">
      <audio ref={audioRef} src={src} loop onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
      
      {/* Cassette Body */}
      <div className="bg-slate-900 rounded-lg p-2 shadow-lg relative border-2 border-slate-700">
         
         {/* Cassette Label Area */}
         <div className="bg-yellow-400 rounded-md p-2 flex items-center justify-between border border-slate-900 h-16 relative overflow-hidden">
            
            {/* Spinning Reels Animation */}
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
            </div>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
            </div>

            {/* Center Controls */}
            <div className="z-10 flex gap-4 mx-auto items-center">
                <button 
                    onClick={() => fileRef.current?.click()}
                    className="p-2 bg-white border-2 border-slate-900 rounded-full hover:bg-slate-100 active:scale-95 transition-transform"
                    title="Change Song"
                >
                    <Upload size={16} />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="p-3 bg-rose-500 text-white border-2 border-slate-900 rounded-full hover:bg-rose-600 active:scale-95 transition-transform shadow-sm"
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>
            </div>
         </div>

         {/* Bottom decorative details */}
         <div className="flex justify-between px-4 mt-1">
             <span className="text-[10px] text-slate-500 font-mono">A SIDE</span>
             <span className="text-[10px] text-slate-500 font-mono">STEREO</span>
         </div>
      </div>
      
      {/* Song Title Ticker */}
      <div className="mt-1 text-center">
        <span className="font-hand font-bold text-slate-500 text-sm flex items-center justify-center gap-1">
            <Music size={12} /> {src ? "Now Playing: Our Song" : "Add our song..."}
        </span>
      </div>

      <input type="file" ref={fileRef} accept="audio/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default MusicPlayer;
