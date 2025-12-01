
import React, { useRef } from 'react';
import { Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { StickerDefinition } from './Doodles';

interface StickerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  stickerLibrary: StickerDefinition[];
  onAddStickerToCanvas: (src: string) => void;
  onUploadStickerToLibrary: (src: string) => void;
  onDeleteStickerFromLibrary?: (id: string) => void;
}

const StickerMenu: React.FC<StickerMenuProps> = ({ 
  isOpen, 
  onClose, 
  stickerLibrary, 
  onAddStickerToCanvas, 
  onUploadStickerToLibrary, 
  onDeleteStickerFromLibrary 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/gif') {
        if (file.size > 2 * 1024 * 1024) {
             alert("GIF too large (Max 2MB)");
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
    if (e.target.files && e.target.files.length > 0) {
      // Process all selected files
      for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          try {
            const processedBase64 = await processImage(file);
            onUploadStickerToLibrary(processedBase64);
          } catch (err) { 
              console.error(err); 
          }
      }
      // Do NOT close menu so user can see uploads
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-2xl overflow-hidden relative transform -rotate-1">
            
            {/* Header */}
            <div className="bg-yellow-300 p-4 border-b-4 border-slate-900 flex justify-between items-center">
                <h3 className="font-marker text-3xl text-slate-900">Sticker Box</h3>
                <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full"><X size={28} strokeWidth={2.5} /></button>
            </div>

            {/* Grid */}
            <div className="p-5 bg-grid-pattern max-h-[50vh] overflow-y-auto custom-scrollbar">
                {stickerLibrary.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-hand text-xl">No stickers yet! <br/> Upload some cute ones 👇</div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {stickerLibrary.map((sticker) => (
                            <div key={sticker.id} className="relative group aspect-square">
                                <button 
                                    onClick={() => {
                                        onAddStickerToCanvas(sticker.src);
                                        onClose(); // Auto-Close on Selection
                                    }}
                                    className="w-full h-full bg-white border-2 border-slate-200 rounded-lg hover:border-slate-800 hover:bg-yellow-50 transition-all p-2 flex items-center justify-center shadow-sm active:scale-95"
                                >
                                    <img src={sticker.src} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
                                </button>
                                {/* Delete Button for Custom Stickers */}
                                {sticker.id.startsWith('c-') && onDeleteStickerFromLibrary && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteStickerFromLibrary(sticker.id); }}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:scale-110"
                                    >
                                        <Trash2 size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Upload */}
            <div className="p-4 bg-white border-t-4 border-slate-900 border-dashed">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-hand font-bold text-xl hover:bg-slate-700 shadow-md active:translate-y-0.5 active:shadow-none transition-all"
                >
                    <ImageIcon size={24} /><span>Upload Stickers</span>
                </button>
                {/* 'multiple' attribute allows selecting multiple files */}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            </div>
        </div>
    </div>
  );
};

export default StickerMenu;
