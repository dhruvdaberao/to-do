
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

// Custom SVG Tape with ZigZag edges
const ZigZagTape: React.FC<{ className?: string }> = ({ className }) => (
  // Use mix-blend-multiply for realistic transparency effect over the photo
  <div className={`absolute w-40 h-12 z-20 pointer-events-none mix-blend-multiply opacity-50 ${className}`}>
     <svg width="100%" height="100%" viewBox="0 0 160 40" preserveAspectRatio="none">
        <defs>
            <filter id="tape-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" in="noise" result="coloredNoise" />
                <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
                <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
            </filter>
        </defs>
        {/* Yellow tape base with jagged ends - Color is slightly darker yellow to work well with multiply mode */}
        <path 
            d="M5,0 L155,0 L160,5 L155,10 L160,15 L155,20 L160,25 L155,30 L160,35 L155,40 L5,40 L0,35 L5,30 L0,25 L5,20 L0,15 L5,10 L0,5 Z" 
            fill="#fcd34d" 
            filter="url(#tape-texture)"
        />
     </svg>
  </div>
);

const TapedPhoto: React.FC = () => {
  // Default to 'us.png' initially
  const [image, setImage] = useState<string>('us.png');
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved image from localStorage on mount
  useEffect(() => {
    const savedImage = localStorage.getItem('our-memory-photo');
    if (savedImage) {
        setImage(savedImage);
        setImgError(false);
    }
  }, []);

  // Helper to compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800; // Resize main photo to max 800px
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
             // 0.8 quality jpeg
             resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
             resolve(img.src);
          }
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        try {
            const compressedBase64 = await compressImage(file);
            setImage(compressedBase64);
            setImgError(false);
            
            // Attempt to save to local storage
            try {
                localStorage.setItem('our-memory-photo', compressedBase64);
            } catch (error) {
                console.error("Storage full:", error);
                alert("Storage is full! Try removing some stickers first.");
            }
        } catch (err) {
            console.error("Image processing error", err);
        }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group mx-auto w-full max-w-lg perspective-1000 mt-8 mb-8">
        
      {/* ZigZag Tape strips - Imperfectly placed and translucent */}
      <ZigZagTape className="-top-6 left-[25%] -rotate-3 scale-110" />
      <ZigZagTape className="-bottom-5 right-[25%] rotate-2 scale-105" />

      {/* The Photo Frame - Horizontal/Landscape */}
      <div 
        className="relative bg-white p-4 pb-16 shadow-xl transform -rotate-1 transition-transform duration-500 hover:rotate-0 hover:scale-[1.02] cursor-pointer border border-slate-200"
        onClick={triggerUpload}
        title="Click to change photo"
      >
        <div className="aspect-video w-full flex items-center justify-center overflow-hidden bg-slate-50 relative shadow-inner">
          
          {!imgError ? (
            <img 
              src={image} 
              alt="Us" 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover grayscale-[10%] contrast-[1.05] group-hover:grayscale-0 transition-all duration-700" 
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center gap-2">
              <ImageIcon size={48} strokeWidth={1.5} className="opacity-50" />
              <span className="font-hand text-xl font-bold opacity-70">Tap to add our moment</span>
            </div>
          )}

          {/* Hover Overlay for upload hint */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-sm">
                <Upload size={24} className="text-slate-600" />
            </div>
          </div>
        </div>
        
        {/* Caption Area */}
        <div className="mt-6 text-center transform -rotate-1">
             <p className="font-marker text-3xl text-slate-800">
                {imgError ? "Pick a memory <3" : "Best. Day. Ever."}
             </p>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default TapedPhoto;
