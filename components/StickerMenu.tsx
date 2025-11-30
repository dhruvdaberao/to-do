
import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Sparkles, X, Trash2 } from 'lucide-react';
import { StickerDefinition } from './Doodles';

interface StickerMenuProps {
  stickerLibrary: StickerDefinition[];
  onAddStickerToCanvas: (src: string) => void;
  onUploadStickerToLibrary: (src: string) => void;
  onDeleteStickerFromLibrary?: (id: string) => void; // Added optional prop
}

const StickerMenu: React.FC<StickerMenuProps> = ({ stickerLibrary, onAddStickerToCanvas, onUploadStickerToLibrary, onDeleteStickerFromLibrary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/gif') {
        if (file.size > 2 * 1024 * 1024) {
             alert("GIF too large");
             reject("File too large");
             return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target?.result as string);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             resolve(canvas.toDataURL('image/png'));
          } else { resolve(img.src); }
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processedBase64 = await processImage(e.target.files[0]);
        onUploadStickerToLibrary(processedBase64);
        setIsOpen(false);
      } catch (err) { console.error(err); }
    }
  };

  return (
    <>
        <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
            <div className="relative group">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="relative z-50 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all duration-300 transform bg-yellow-400 text-slate-900 -rotate-3 hover:rotate-3 hover:scale-105"
                >
                    <Sparkles size={28} strokeWidth={2.5} />
                </button>
                {!isOpen && (
                    <div className="absolute left-full top-2 ml-4 animate-pulse hidden sm:block pointer-events-none">
                        <div className="bg-white border-2 border-slate-900 px-3 py-1 rounded-md shadow-sm relative">
                            <span className="font-marker text-xl whitespace-nowrap text-slate-900">Add stickers!</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {isOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-2xl overflow-hidden relative transform -rotate-1">
                    <div className="bg-yellow-300 p-4 border-b-4 border-slate-900 flex justify-between items-center">
                        <h3 className="font-marker text-3xl text-slate-900">Sticker Box</h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/10 rounded-full"><X size={28} strokeWidth={2.5} /></button>
                    </div>
                    <div className="p-5 bg-grid-pattern max-h-[60vh] overflow-y-auto">
                        {stickerLibrary.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 font-hand text-xl">No stickers yet! <br/> Upload some cute ones 👇</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {stickerLibrary.map((sticker) => (
                                    <div key={sticker.id} className="relative group aspect-square">
                                        <button 
                                            onClick={() => { onAddStickerToCanvas(sticker.src); setIsOpen(false); }}
                                            className="w-full h-full bg-white border-2 border-slate-200 rounded-lg hover:border-slate-800 hover:bg-yellow-50 transition-all p-2 flex items-center justify-center shadow-sm"
                                        >
                                            <img src={sticker.src} alt="sticker" className="w-full h-full object-contain" />
                                        </button>
                                        {/* Delete Button for Custom Stickers */}
                                        {sticker.id.startsWith('c-') && onDeleteStickerFromLibrary && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteStickerFromLibrary(sticker.id); }}
                                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-white border-t-4 border-slate-900 border-dashed">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-hand font-bold text-xl hover:bg-slate-700 shadow-md">
                            <ImageIcon size={20} /><span>Upload New Sticker</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default StickerMenu;
