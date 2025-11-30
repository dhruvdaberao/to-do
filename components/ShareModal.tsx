
import React, { useState } from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  pin: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId, pin }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, setFn: (b: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleNativeShare = async () => {
    const url = window.location.origin;
    const text = `Join my Countdown!\nRoom: ${roomId}\nPIN: ${pin}\nLink: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Countdown', text, url });
      } catch (e) { console.log('Share dismissed'); }
    } else {
      navigator.clipboard.writeText(text);
      alert('Invite info copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden transform rotate-1">
        
        {/* Header */}
        <div className="bg-yellow-400 p-4 border-b-4 border-slate-900 flex justify-between items-center">
          <h3 className="font-marker text-3xl text-slate-900">Invite Your Person</h3>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full"><X size={28} strokeWidth={2.5} /></button>
        </div>
        
        <div className="p-6 bg-grid-pattern space-y-6">
          
          {/* Room ID */}
          <div className="space-y-1">
            <label className="font-hand font-bold text-slate-500 uppercase tracking-wider text-sm">Room Name</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border-2 border-slate-900 rounded-lg p-3 font-bold text-xl text-slate-800">{roomId}</div>
              <button 
                onClick={() => copyToClipboard(roomId, setCopiedId)}
                className="bg-sky-200 border-2 border-slate-900 rounded-lg p-3 hover:bg-sky-300 transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none"
              >
                {copiedId ? <Check size={24} strokeWidth={3} className="text-slate-900" /> : <Copy size={24} strokeWidth={2.5} className="text-slate-900" />}
              </button>
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-1">
            <label className="font-hand font-bold text-slate-500 uppercase tracking-wider text-sm">Secret PIN</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border-2 border-slate-900 rounded-lg p-3 font-bold text-xl tracking-widest text-slate-800">{pin}</div>
              <button 
                onClick={() => copyToClipboard(pin, setCopiedPin)}
                className="bg-sky-200 border-2 border-slate-900 rounded-lg p-3 hover:bg-sky-300 transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none"
              >
                {copiedPin ? <Check size={24} strokeWidth={3} className="text-slate-900" /> : <Copy size={24} strokeWidth={2.5} className="text-slate-900" />}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button 
            onClick={handleNativeShare}
            className="w-full bg-slate-900 text-yellow-400 py-4 rounded-xl font-hand font-bold text-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(253,224,71,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            <Share2 size={24} strokeWidth={3} /> Send Link
          </button>

        </div>
      </div>
    </div>
  );
};

export default ShareModal;
