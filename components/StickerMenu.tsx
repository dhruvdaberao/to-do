
import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { StickerDefinition } from './Doodles';

interface StickerMenuProps {
  stickerLibrary: StickerDefinition[];
  onAddStickerToCanvas: (src: string) => void;
  onUploadStickerToLibrary: (src: string) => void;
}

const StickerMenu: React.FC<StickerMenuProps> = ({ stickerLibrary, onAddStickerToCanvas, onUploadStickerToLibrary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to process images
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. If it's a GIF, bypass canvas resizing to preserve animation
      // Limit size to 2MB to prevent storage crash
      if (file.type === 'image/gif') {
        if (file.size > 2 * 1024 * 1024) {
             alert("GIF is too large! Please use one under 2MB.");
             reject("File too large");
             return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        return;
      }

      // 2. For static images, resize and force PNG to keep transparency
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300; // Resize to max 300px for stickers
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             // CRITICAL: Always use 'image/png' to preserve transparency. 
             // JPEGs turn transparent pixels black.
             resolve(canvas.toDataURL('image/png'));
          } else {
             resolve(img.src);
          }
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        const processedBase64 = await processImage(file);
        onUploadStickerToLibrary(processedBase64);
        setIsOpen(false); // Close menu after upload so user sees the new sticker
      } catch (err) {
        console.error("Error processing image", err);
      }
    }
  };

  return (
    <>
        <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
            <div className="relative group">
                {/* The Quirky Button */}
                <button 
                    onClick={() => setIsOpen(true)}
                    className={`
                        relative z-50 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center 
                        border-4 border-slate-900 rounded-2xl
                        shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]
                        transition-all duration-300 transform
                        bg-yellow-400 text-slate-900 -rotate-3 hover:rotate-3 hover:scale-105 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]
                    `}
                    aria-label="Open Sticker Menu"
                >
                    <Sparkles size={28} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
                </button>

                {/* "Add Stickers" Label */}
                {!isOpen && (
                    <div className="absolute left-full top-2 ml-4 transition-all duration-300 transform rotate-6 animate-pulse hidden sm:block pointer-events-none">
                        <div className="bg-white border-2 border-slate-900 px-3 py-1 rounded-md shadow-sm relative">
                            <span className="font-marker text-xl whitespace-nowrap text-slate-900">Add stickers!</span>
                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-slate-900"></div>
                            <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-white"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Full Screen Modal Overlay for Menu */}
        {isOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-2xl overflow-hidden relative transform -rotate-1">
                    
                    {/* Header */}
                    <div className="bg-yellow-300 p-4 border-b-4 border-slate-900 flex justify-between items-center">
                        <h3 className="font-marker text-3xl text-slate-900">Sticker Box</h3>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 bg-grid-pattern max-h-[60vh] overflow-y-auto">
                        
                        {stickerLibrary.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 font-hand text-xl">
                                No stickers yet! <br/> Upload some cute ones 👇
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {stickerLibrary.map((sticker) => (
                                    <button 
                                        key={sticker.id}
                                        onClick={() => { onAddStickerToCanvas(sticker.src); setIsOpen(false); }}
                                        className="aspect-square bg-white border-2 border-slate-200 rounded-lg hover:border-slate-800 hover:bg-yellow-50 transition-all p-2 flex items-center justify-center group relative shadow-sm"
                                        title={sticker.label}
                                    >
                                        <img 
                                            src={sticker.src} 
                                            alt={sticker.label} 
                                            className="w-full h-full object-contain transition-transform group-hover:scale-110"
                                            onError={(e) => {
                                                // If image is broken, hide the button entirely so no empty boxes show
                                                (e.target as HTMLElement).closest('button')!.style.display = 'none';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                    </div>

                    {/* Footer / Upload */}
                    <div className="p-4 bg-white border-t-4 border-slate-900 border-dashed">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-hand font-bold text-xl hover:bg-slate-700 hover:-translate-y-1 transition-all shadow-md active:translate-y-0"
                        >
                            <ImageIcon size={20} />
                            <span>Upload New Sticker</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                         <p className="text-center text-[10px] text-slate-400 mt-2 font-sans">
                            Supports PNG (transparent) & GIFs!
                        </p>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default StickerMenu;
