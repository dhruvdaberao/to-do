
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
      // Aggressively compress to ensure it saves to MongoDB
      const MAX_SIZE = 250; 
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
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
             // Use 0.7 quality to save space
             resolve(canvas.toDataURL('image/png', 0.7));
          } else { resolve(img.src); }
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
          // Fix: Use standard loop to avoid TypeScript issues with FileList iteration
          const promises: Promise<string>[] = [];
          for (let i = 0; i < files.length; i++) {
              const file = files.item(i);
              if (file) {
                  promises.push(processImage(file));
              }
          }
          
          const results = await Promise.all(promises);
          results.forEach(src => onUploadStickerToLibrary(src));
          
          // Clear input so the same file can be selected again if needed
          if (e.target) e.target.value = '';
      } catch (err) {
          console.error("Upload failed", err);
          alert("Some images failed to process.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-xl border-4 border-slate-900 shadow-2xl overflow-hidden relative transform -rotate-1 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-yellow-300 p-4 border-b-4 border-slate-900 flex justify-between items-center shrink-0">
                <h3 className="font-marker text-3xl text-slate-900">Sticker Box ({stickerLibrary.length})</h3>
                <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full"><X size={28} strokeWidth={2.5} /></button>
            </div>

            {/* Grid - Scrollable Area */}
            <div className="flex-1 p-5 bg-grid-pattern overflow-y-auto custom-scrollbar min-h-0">
                {stickerLibrary.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-hand text-xl">No stickers yet! <br/> Upload unlimited cute ones 👇</div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-4">
                        {stickerLibrary.map((sticker) => (
                            <div key={sticker.id} className="relative group aspect-square">
                                <button 
                                    onClick={() => {
                                        onAddStickerToCanvas(sticker.src);
                                    }}
                                    className="w-full h-full bg-white border-2 border-slate-200 rounded-lg hover:border-slate-800 hover:bg-yellow-50 transition-all p-2 flex items-center justify-center shadow-sm active:scale-95"
                                >
                                    <img src={sticker.src} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
                                </button>
                                {/* Delete Button for Custom Stickers */}
                                {sticker.id.startsWith('c-') && onDeleteStickerFromLibrary && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteStickerFromLibrary(sticker.id); }}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:scale-110"
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
            <div className="p-4 bg-white border-t-4 border-slate-900 border-dashed shrink-0">
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
