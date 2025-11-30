
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { calculateTimeLeft, TimeLeft, getNextAnniversaryDateString } from './utils/time';
import CountdownTimer from './components/CountdownTimer';
import TapedPhoto from './components/TapedPhoto';
import StickyNote, { NoteData } from './components/StickyNote';
import DraggableSticker, { StickerData } from './components/DraggableSticker';
import StickerMenu from './components/StickerMenu';
import TrashBin from './components/TrashBin';
import TodoModal from './components/TodoModal';
import QuirkyBubble from './components/QuirkyBubble';
import { AVAILABLE_STICKERS, StickerDefinition } from './components/Doodles';

// Constants
const TARGET_MONTH = 6; // July (0-indexed)
const TARGET_DAY = 6;

// API URL CONFIGURATION
// For Single Repo Deployment (Option 1): We want "/api/data" (relative path)
// For Separate Repo Deployment (Option 2): We check VITE_API_URL
const API_URL = (import.meta as any).env?.VITE_API_URL || "/api/data";

// No default stickers on the canvas initially
const DEFAULT_STICKERS: StickerData[] = [];

const getInitialNoteState = (): NoteData => {
    return { x: 0, y: 0, rotation: -2, scale: 1 };
};

type InteractionMode = 'IDLE' | 'DRAG' | 'RESIZE' | 'ROTATE';

interface InteractionState {
  mode: InteractionMode;
  stickerId: string | null;
  startMouse: { x: number, y: number };
  startPos: { x: number, y: number };
  startScale: number;
  startDistance: number;
  startRotation: number;
  startAngle: number;
}

const App: React.FC = () => {
  // --- STATE ---
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(TARGET_MONTH, TARGET_DAY));
  const [targetDateString, setTargetDateString] = useState<string>('');
  
  // App Data State (Synced)
  const [todoItems, setTodoItems] = useState<string[]>([]);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [noteState, setNoteState] = useState<NoteData>(getInitialNoteState());
  const [redBubbleText, setRedBubbleText] = useState('');
  const [greenBubbleText, setGreenBubbleText] = useState('');
  const [photoData, setPhotoData] = useState<string>('us.png'); // Default photo

  const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>([]);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

  // Interaction State
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE',
    stickerId: null,
    startMouse: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    startScale: 1,
    startDistance: 0,
    startRotation: 0,
    startAngle: 0,
  });

  const [isOverTrash, setIsOverTrash] = useState(false);
  const isSyncingRef = useRef(false); // To prevent fetch loops

  // --- SYNC LOGIC ---

  // 1. Fetch from Backend (Polling)
  const fetchData = async () => {
      try {
          const res = await fetch(API_URL);
          if (res.ok) {
              // Try catch for JSON parsing in case endpoint returns HTML error page (common in dev)
              try {
                const data = await res.json();
                // Only update if data exists
                if (data) {
                    isSyncingRef.current = true;
                    if (data.stickers) setStickers(data.stickers);
                    if (data.todoItems) setTodoItems(data.todoItems);
                    if (data.noteState) setNoteState(data.noteState);
                    if (data.redBubble) setRedBubbleText(data.redBubble);
                    if (data.greenBubble) setGreenBubbleText(data.greenBubble);
                    if (data.photo) setPhotoData(data.photo);
                    // Allow updates again after a tick
                    setTimeout(() => { isSyncingRef.current = false; }, 100);
                }
              } catch (jsonError) {
                // Silently ignore JSON parse errors (backend might not be ready)
              }
          }
      } catch (e) {
          // Backend not running, ignore silently and use local state
      }
  };

  // 2. Save to Backend
  const saveDataToBackend = useCallback(async () => {
      if (isSyncingRef.current) return; // Don't save if we just fetched

      const payload = {
          stickers,
          todoItems,
          noteState,
          redBubble: redBubbleText,
          greenBubble: greenBubbleText,
          photo: photoData
      };

      try {
          await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
      } catch (e) {
          // Backend not running
      }
  }, [stickers, todoItems, noteState, redBubbleText, greenBubbleText, photoData]);

  // Initial Load & Polling
  useEffect(() => {
    setTargetDateString(getNextAnniversaryDateString(TARGET_MONTH, TARGET_DAY));
    
    // Timer
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(TARGET_MONTH, TARGET_DAY));
    }, 1000);

    // Initial Load from LocalStorage (Fallback)
    const loadLocal = (key: string, setter: Function, defaultVal: any) => {
        const saved = localStorage.getItem(key);
        if (saved) setter(JSON.parse(saved));
        else setter(defaultVal);
    };
    
    loadLocal('bucket-list-items', setTodoItems, ['Plan a cute date', 'Buy chocolates']);
    loadLocal('my-stickers', setStickers, DEFAULT_STICKERS);
    loadLocal('my-note-state', setNoteState, getInitialNoteState());
    loadLocal('my-custom-stickers', setCustomLibrary, []);
    
    const savedPhoto = localStorage.getItem('our-memory-photo');
    if (savedPhoto) setPhotoData(savedPhoto);
    
    const rTxt = localStorage.getItem('red-bubble-text');
    if (rTxt) setRedBubbleText(rTxt);
    const gTxt = localStorage.getItem('green-bubble-text');
    if (gTxt) setGreenBubbleText(gTxt);

    // Start Polling for Sync
    fetchData(); // Initial fetch
    const syncInterval = setInterval(fetchData, 3000); // Poll every 3 seconds

    return () => {
        clearInterval(timer);
        clearInterval(syncInterval);
    };
  }, []);

  // Save Effects (Auto-save to LocalStorage AND Backend)
  useEffect(() => {
    localStorage.setItem('bucket-list-items', JSON.stringify(todoItems));
    saveDataToBackend();
  }, [todoItems, saveDataToBackend]);

  useEffect(() => {
    localStorage.setItem('my-stickers', JSON.stringify(stickers));
    saveDataToBackend();
  }, [stickers, saveDataToBackend]);
  
  useEffect(() => {
    localStorage.setItem('my-note-state', JSON.stringify(noteState));
    saveDataToBackend();
  }, [noteState, saveDataToBackend]);

  useEffect(() => {
    localStorage.setItem('red-bubble-text', redBubbleText);
    saveDataToBackend();
  }, [redBubbleText, saveDataToBackend]);

  useEffect(() => {
    localStorage.setItem('green-bubble-text', greenBubbleText);
    saveDataToBackend();
  }, [greenBubbleText, saveDataToBackend]);

  useEffect(() => {
    localStorage.setItem('our-memory-photo', photoData);
    saveDataToBackend();
  }, [photoData, saveDataToBackend]);

  useEffect(() => {
      if (customLibrary.length > 0) {
          localStorage.setItem('my-custom-stickers', JSON.stringify(customLibrary));
      }
  }, [customLibrary]);


  // --- HANDLERS ---

  const addStickerToCanvas = (src: string) => {
    const scrollY = window.scrollY || 0;
    const newSticker: StickerData = {
        id: `s-${Date.now()}`,
        type: 'image',
        src,
        x: window.innerWidth / 2 - 50 + (Math.random() * 40 - 20),
        y: scrollY + window.innerHeight / 2 - 50 + (Math.random() * 40 - 20),
        rotation: Math.random() * 30 - 15,
        scale: 1,
    };
    setStickers([...stickers, newSticker]);
  };

  const uploadStickerToLibrary = (src: string) => {
      const newDef: StickerDefinition = {
          id: `custom-${Date.now()}`,
          src: src,
          label: 'Custom Sticker'
      };
      setCustomLibrary(prev => [...prev, newDef]);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    let target = { x: 0, y: 0, scale: 1, rotation: 0 };
    
    if (id === 'bucket-list') {
        target = { ...noteState };
    } else {
        const sticker = stickers.find(s => s.id === id);
        if (!sticker) return;
        target = { ...sticker };
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setInteraction({
        mode: 'DRAG',
        stickerId: id,
        startMouse: { x: clientX, y: clientY },
        startPos: { x: target.x, y: target.y },
        startScale: target.scale,
        startDistance: 0,
        startRotation: target.rotation,
        startAngle: 0
    });
  };

  const getElementCenter = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
      };
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    let targetScale = 1;
    if (id === 'bucket-list') targetScale = noteState.scale;
    else {
        const sticker = stickers.find(s => s.id === id);
        if (!sticker) return;
        targetScale = sticker.scale;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const center = getElementCenter(id);
    if (!center) return;

    const dist = Math.sqrt(Math.pow(clientX - center.x, 2) + Math.pow(clientY - center.y, 2));

    setInteraction({
        mode: 'RESIZE',
        stickerId: id,
        startMouse: { x: clientX, y: clientY },
        startPos: { x: 0, y: 0 },
        startScale: targetScale,
        startDistance: dist,
        startRotation: 0,
        startAngle: 0
    });
  };

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    let targetRotation = 0;
    if (id === 'bucket-list') targetRotation = noteState.rotation;
    else {
        const sticker = stickers.find(s => s.id === id);
        if (!sticker) return;
        targetRotation = sticker.rotation;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const center = getElementCenter(id);
    if (!center) return;

    const angle = Math.atan2(clientY - center.y, clientX - center.x);

    setInteraction({
        mode: 'ROTATE',
        stickerId: id,
        startMouse: { x: clientX, y: clientY },
        startPos: { x: 0, y: 0 },
        startScale: 1,
        startDistance: 0,
        startRotation: targetRotation,
        startAngle: angle 
    });
  };

  const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (interaction.mode === 'IDLE' || !interaction.stickerId) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const updateTarget = (updateFn: (s: any) => any) => {
        if (interaction.stickerId === 'bucket-list') {
            setNoteState(prev => updateFn(prev));
        } else {
            setStickers(prev => prev.map(s => s.id === interaction.stickerId ? updateFn(s) : s));
        }
    };

    if (interaction.mode === 'DRAG') {
        const deltaX = clientX - interaction.startMouse.x;
        const deltaY = clientY - interaction.startMouse.y;
        const newX = interaction.startPos.x + deltaX;
        const newY = interaction.startPos.y + deltaY;

        updateTarget(s => ({ ...s, x: newX, y: newY }));

        if (interaction.stickerId !== 'bucket-list') {
            const trashZone = { x: window.innerWidth / 2, y: window.innerHeight - 50, radius: 100 };
            const distance = Math.sqrt(Math.pow(clientX - trashZone.x, 2) + Math.pow(clientY - trashZone.y, 2));
            setIsOverTrash(distance < trashZone.radius);
        }
    } 
    else if (interaction.mode === 'RESIZE') {
        const center = getElementCenter(interaction.stickerId);
        if (center) {
             const currentDist = Math.sqrt(Math.pow(clientX - center.x, 2) + Math.pow(clientY - center.y, 2));
             if (interaction.startDistance > 0) {
                const scaleFactor = currentDist / interaction.startDistance;
                const newScale = Math.max(0.3, Math.min(5, interaction.startScale * scaleFactor));
                updateTarget(s => ({ ...s, scale: newScale }));
            }
        }
    }
    else if (interaction.mode === 'ROTATE') {
        const center = getElementCenter(interaction.stickerId);
        if (center) {
            const currentAngle = Math.atan2(clientY - center.y, clientX - center.x);
            const angleDiff = currentAngle - interaction.startAngle;
            const angleDiffDeg = angleDiff * (180 / Math.PI);
            updateTarget(s => ({ ...s, rotation: interaction.startRotation + angleDiffDeg }));
        }
    }

  }, [interaction]);

  const handleGlobalEnd = useCallback(() => {
    if (interaction.mode === 'DRAG' && interaction.stickerId) {
        if (isOverTrash && interaction.stickerId !== 'bucket-list') {
            setStickers(prev => prev.filter(s => s.id !== interaction.stickerId));
        }
    }
    setInteraction(prev => ({ ...prev, mode: 'IDLE', stickerId: null }));
    setIsOverTrash(false);
  }, [interaction, isOverTrash]);

  useEffect(() => {
    if (interaction.mode !== 'IDLE') {
        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalEnd);
        window.addEventListener('touchmove', handleGlobalMove, { passive: false });
        window.addEventListener('touchend', handleGlobalEnd);
    }
    return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalEnd);
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [interaction.mode, handleGlobalMove, handleGlobalEnd]);


  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-6 relative overflow-x-hidden bg-grid-pattern pb-32">
      
      <StickerMenu 
        stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
        onAddStickerToCanvas={addStickerToCanvas} 
        onUploadStickerToLibrary={uploadStickerToLibrary}
      />
      
      <TrashBin isVisible={interaction.mode === 'DRAG' && interaction.stickerId !== 'bucket-list'} isHovered={isOverTrash} />

      <TodoModal 
        isOpen={isTodoModalOpen} 
        onClose={() => setIsTodoModalOpen(false)}
        items={todoItems}
        setItems={setTodoItems}
      />

      <div className="flex flex-col items-center gap-6 z-10 mt-20 sm:mt-8 mb-10 w-full max-w-4xl">
        <div className="text-center">
             <h1 className="text-5xl sm:text-7xl font-marker text-slate-800 mb-6 drop-shadow-sm leading-tight">
                Counting down to Us
             </h1>
             
             {/* Quirky Tag - Sky Blue, Tilted, Hard Shadow */}
             <div className="inline-block transform -rotate-2 hover:rotate-2 transition-transform duration-300">
                 <div className="bg-sky-200 border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] px-4 py-2 rounded-xl">
                    <span className="font-hand text-lg sm:text-xl text-slate-900 font-bold uppercase tracking-wider">
                        Next Anniversary • {targetDateString}
                    </span>
                 </div>
             </div>
        </div>

        <CountdownTimer timeLeft={timeLeft} />
      </div>

      <TapedPhoto imageSrc={photoData} onImageUpload={setPhotoData} />

      <div className="mt-8 mb-12 text-center z-30 opacity-90 max-w-md px-4 relative transform -rotate-1">
        <div className="relative inline-block p-4">
             {/* Highlighter - Light Green */}
             <div className="absolute inset-0 bg-green-200/40 rounded-lg -rotate-1 scale-110 pointer-events-none -z-10 blur-[1px]"></div>
             
             <p className="font-marker text-3xl sm:text-4xl text-slate-800 leading-tight drop-shadow-sm">
                "Every second that ticks by is just one second closer to making more memories with you."
             </p>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-rose-500">
            <span className="font-marker text-xl">Love always</span>
            <Heart size={20} fill="currentColor" className="animate-pulse" />
        </div>
      </div>

      <div className="z-10 relative w-full flex justify-center mb-16">
         <StickyNote 
            data={noteState}
            onMouseDown={(e) => handleDragStart(e, 'bucket-list')}
            onResizeStart={(e) => handleResizeStart(e, 'bucket-list')}
            onRotateStart={(e) => handleRotateStart(e, 'bucket-list')}
            onClick={() => setIsTodoModalOpen(true)}
         >
            <span className="font-bold text-2xl mb-1 block text-rose-500 pb-2">Bucket List</span>
            <ul className="space-y-1">
                {todoItems.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></span>
                        <span className="truncate">{item}</span>
                    </li>
                ))}
                {todoItems.length > 4 && (
                    <li className="text-slate-400 text-sm pl-4 italic">
                        + {todoItems.length - 4} more...
                    </li>
                )}
            </ul>
         </StickyNote>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 z-10 w-full mb-32 px-4">
          <QuirkyBubble 
            text={redBubbleText} 
            setText={setRedBubbleText} 
            color="red" 
            rotation="-rotate-3" 
          />
          <QuirkyBubble 
            text={greenBubbleText} 
            setText={setGreenBubbleText} 
            color="green" 
            rotation="rotate-3" 
          />
      </div>

      {stickers.map(sticker => (
          <DraggableSticker 
            key={sticker.id} 
            data={sticker} 
            onMouseDown={handleDragStart}
            onResizeStart={handleResizeStart}
            onRotateStart={handleRotateStart}
          />
      ))}
    </div>
  );
};

export default App;
