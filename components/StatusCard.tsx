

import React, { useRef, useState } from 'react';
import { Camera, Edit2 } from 'lucide-react';

interface StatusCardProps {
  data: { image: string, caption: string, user: string };
  onUpdate: (newData: { image: string, caption: string, user: string }) => void;
  currentUser: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ data, onUpdate, currentUser }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempCaption, setTempCaption] = useState(data.caption);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            onUpdate({ ...data, image: ev.target?.result as string, user: currentUser });
        };
        reader.readAsDataURL(file);
    }
  };

  const saveCaption = () => {
    onUpdate({ ...data, caption: tempCaption, user: currentUser });
    setIsEditing(false);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto mt-12 mb-8 group">
      {/* Title */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-yellow-400 px-4 py-1 rounded-full border-2 border-white shadow-md z-20 font-marker text-lg transform -rotate-2">
         ✨ Current Vibe ✨
      </div>

      {/* Polaroid Card */}
      <div className="bg-white p-4 pb-12 shadow-xl transform rotate-1 border border-slate-200 transition-transform hover:rotate-0">
        
        {/* Image Area */}
        <div 
            className="aspect-square bg-slate-100 mb-4 overflow-hidden relative cursor-pointer group/img border border-slate-100"
            onClick={() => fileRef.current?.click()}
        >
            {data.image ? (
                <img src={data.image} alt="Status" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Camera size={48} />
                </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold font-sans backdrop-blur-sm">Change</span>
            </div>
        </div>

        {/* Caption Area */}
        <div className="text-center relative">
            {isEditing ? (
                <div className="flex flex-col gap-2">
                    <input 
                        value={tempCaption} 
                        onChange={(e) => setTempCaption(e.target.value)}
                        className="w-full border-b-2 border-slate-900 text-center font-hand font-bold text-xl focus:outline-none"
                        autoFocus
                    />
                    <button onClick={saveCaption} className="text-xs bg-slate-900 text-white px-2 py-1 rounded self-center">Save</button>
                </div>
            ) : (
                <div onClick={() => { setTempCaption(data.caption); setIsEditing(true); }} className="cursor-pointer hover:bg-yellow-50 rounded px-2 py-1 transition-colors">
                    <p className="font-hand font-bold text-2xl text-slate-800 break-words leading-tight">{data.caption || "..."}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">
                        Updated by {data.user || "Ghost"}
                    </p>
                </div>
            )}
        </div>

      </div>

      {/* Tape */}
      <div className="absolute -top-3 left-[30%] w-24 h-8 bg-rose-400/80 -rotate-3 opacity-80 mix-blend-multiply"></div>

      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
    </div>
  );
};

export default StatusCard;
