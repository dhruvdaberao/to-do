
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Users, LogOut, Eraser, Trash2 } from 'lucide-react';
import { calculateTimeLeft, TimeLeft } from '../utils/time';
import CountdownTimer from './CountdownTimer';
import TapedPhoto from './TapedPhoto';
import StickyNote, { NoteData } from './StickyNote';
import DraggableSticker, { StickerData } from './DraggableSticker';
import StickerMenu from './StickerMenu';
import TrashBin from './TrashBin';
import TodoModal from './TodoModal';
import QuirkyBubble from './QuirkyBubble';
import ChatDrawer from './ChatDrawer';
import PeopleList from './PeopleList';
import { AVAILABLE_STICKERS, StickerDefinition } from './Doodles';

interface CountdownRoomProps {
  room: any;
  currentUser: string;
  apiUrl: string;
  onExit: () => void;
}

// Interaction State Types
type InteractionMode = 'IDLE' | 'DRAG' | 'RESIZE' | 'ROTATE';
interface InteractionState {
  mode: InteractionMode;
  targetId: string | null; // 'bucket-list' or sticker ID
  startMouse: { x: number, y: number };
  initialData: { x: number, y: number, scale: number, rotation: number };
}

const CountdownRoom: React.FC<CountdownRoomProps> = ({ room, currentUser, apiUrl, onExit }) => {
  // --- STATE ---
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Synced Data
  const [stickers, setStickers] = useState<StickerData[]>(room.stickers || []);
  const [todoItems, setTodoItems] = useState<string[]>(room.todoItems || []);
  const [noteState, setNoteState] = useState<NoteData>(room.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
  const [redBubbleText, setRedBubbleText] = useState(room.redBubble || '');
  const [greenBubbleText, setGreenBubbleText] = useState(room.greenBubble || '');
  const [photoData, setPhotoData] = useState<string>(room.photo || 'us.png');
  const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>(room.customLibrary || []);
  const [chatMessages, setChatMessages] = useState<any[]>(room.chatMessages || []);
  const [members, setMembers] = useState<string[]>(room.members || []);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  
  // Interaction Engine State
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE', targetId: null, startMouse: {x:0,y:0}, initialData: {x:0,y:0,scale:1,rotation:0}
  });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Refs for logic that shouldn't trigger re-renders or needs immediate access
  const isInteractingRef = useRef(false); // BLOCKS sync while true
  const isSyncingRef = useRef(false);

  // --- SYNC ENGINE ---
  const syncRoom = async () => {
    // CRITICAL: Do not overwrite local state if user is currently moving something
    if (isInteractingRef.current || isSyncingRef.current) return;

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId: room.roomId } })
        });
        const data = await res.json();
        if (data.roomId) {
            isSyncingRef.current = true;
            // Only update if not currently interacting (double check)
            if (!isInteractingRef.current) {
                setStickers(data.stickers || []);
                setTodoItems(data.todoItems || []);
                setNoteState(data.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
                setRedBubbleText(data.redBubble || '');
                setGreenBubbleText(data.greenBubble || '');
                setPhotoData(data.photo || 'us.png');
                setCustomLibrary(data.customLibrary || []);
                setChatMessages(data.chatMessages || []);
                setMembers(data.members || []);
            }
            setTimeout(() => { isSyncingRef.current = false; }, 50);
        }
    } catch (e) { console.error("Sync Error", e); }
  };

  const pushUpdates = useCallback(async (updates: any) => {
    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'SYNC_ROOM',
                payload: { roomId: room.roomId, updates }
            })
        });
    } catch (e) { console.error("Push Error", e); }
  }, [apiUrl, room.roomId]);

  // Polling & Timer
  useEffect(() => {
    const { month, day } = room.targetDate;
    const tick = () => setTimeLeft(calculateTimeLeft(month, day));
    tick();
    const timer = setInterval(tick, 1000);
    const poller = setInterval(syncRoom, 1000); // Faster polling for responsiveness
    return () => { clearInterval(timer); clearInterval(poller); };
  }, [room.roomId]);

  // Auto-Save Text Fields (Debounced)
  useEffect(() => { 
      const t = setTimeout(() => pushUpdates({ redBubble: redBubbleText }), 1000);
      return () => clearTimeout(t);
  }, [redBubbleText]);
  
  useEffect(() => { 
      const t = setTimeout(() => pushUpdates({ greenBubble: greenBubbleText }), 1000);
      return () => clearTimeout(t);
  }, [greenBubbleText]);

  // Immediate Save for Lists/Photos/Library
  const updateTodoItems = (items: string[]) => {
      setTodoItems(items);
      pushUpdates({ todoItems: items });
  };
  
  const updatePhoto = (data: string) => {
      setPhotoData(data);
      pushUpdates({ photo: data });
  };

  const handleClearPage = async () => {
    if(!window.confirm("Clear the whole page? This cannot be undone.")) return;
    setStickers([]);
    setTodoItems([]);
    setPhotoData('us.png');
    // Force immediate local clear then sync
    await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_CANVAS', payload: { roomId: room.roomId } })
    });
  };

  const handleSendMessage = (text: string) => {
    const msg = { id: Date.now(), user: currentUser, text, timestamp: new Date().toISOString() };
    const newMsgs = [...chatMessages, msg];
    setChatMessages(newMsgs);
    pushUpdates({ chatMessages: newMsgs });
  };

  const handleDeleteLibraryItem = (id: string) => {
      const newLib = customLibrary.filter(s => s.id !== id);
      setCustomLibrary(newLib);
      pushUpdates({ customLibrary: newLib });
  };

  // --- INTERACTION ENGINE (The Fix for Jumping) ---

  const handleInteractionStart = (e: any, id: string, mode: InteractionMode) => {
      e.preventDefault(); // Stop scrolling on mobile touch
      e.stopPropagation();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Find initial data
      let target: { x: number, y: number, scale: number, rotation: number } | undefined;
      
      if (id === 'bucket-list') {
          target = noteState;
      } else {
          target = stickers.find(s => s.id === id);
      }

      if (!target) return;

      isInteractingRef.current = true; // LOCK SYNC
      setInteraction({
          mode,
          targetId: id,
          startMouse: { x: clientX, y: clientY },
          initialData: { ...target }
      });
  };

  const handleGlobalMove = useCallback((e: any) => {
      if (!isInteractingRef.current || interaction.mode === 'IDLE' || !interaction.targetId) return;
      
      // e.preventDefault(); // prevent scroll dragging on mobile
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - interaction.startMouse.x;
      const dy = clientY - interaction.startMouse.y;

      // Helper to update state locally without server sync yet
      const updateLocal = (newData: Partial<typeof interaction.initialData>) => {
          if (interaction.targetId === 'bucket-list') {
              setNoteState(prev => ({ ...prev, ...newData }));
          } else {
              setStickers(prev => prev.map(s => s.id === interaction.targetId ? { ...s, ...newData } : s));
          }
      };

      if (interaction.mode === 'DRAG') {
          const nx = interaction.initialData.x + dx;
          const ny = interaction.initialData.y + dy;
          updateLocal({ x: nx, y: ny });

          // Trash detection
          if (interaction.targetId !== 'bucket-list') {
              const trashZone = { x: window.innerWidth/2, y: window.innerHeight - 80, radius: 80 };
              const dist = Math.sqrt(Math.pow(clientX - trashZone.x, 2) + Math.pow(clientY - trashZone.y, 2));
              setIsOverTrash(dist < trashZone.radius);
          }
      } else if (interaction.mode === 'RESIZE') {
           // Simple distance based scaling
           const dist = Math.sqrt(dx*dx + dy*dy);
           const factor = (dy > 0 ? 1 : -1) * (dist / 200); // Sensitivity
           const newScale = Math.max(0.5, Math.min(3, interaction.initialData.scale + factor));
           updateLocal({ scale: newScale });
      } else if (interaction.mode === 'ROTATE') {
           // Simple x-drag based rotation
           const newRot = interaction.initialData.rotation + (dx / 2);
           updateLocal({ rotation: newRot });
      }

  }, [interaction]);

  const handleGlobalEnd = useCallback(() => {
      if (!isInteractingRef.current) return;

      // Handle Trash Drop
      if (interaction.mode === 'DRAG' && isOverTrash && interaction.targetId && interaction.targetId !== 'bucket-list') {
          const newStickers = stickers.filter(s => s.id !== interaction.targetId);
          setStickers(newStickers);
          pushUpdates({ stickers: newStickers });
      } else {
          // Save final position to server
          if (interaction.targetId === 'bucket-list') {
              pushUpdates({ noteState });
          } else {
              pushUpdates({ stickers });
          }
      }

      // Reset
      isInteractingRef.current = false; // UNLOCK SYNC
      setInteraction(prev => ({ ...prev, mode: 'IDLE', targetId: null }));
      setIsOverTrash(false);

  }, [interaction, isOverTrash, stickers, noteState, pushUpdates]);

  // Window Listeners
  useEffect(() => {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);
      return () => {
          window.removeEventListener('mousemove', handleGlobalMove);
          window.removeEventListener('mouseup', handleGlobalEnd);
          window.removeEventListener('touchmove', handleGlobalMove);
          window.removeEventListener('touchend', handleGlobalEnd);
      };
  }, [handleGlobalMove, handleGlobalEnd]);


  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 relative overflow-x-hidden bg-grid-pattern pb-40">
        
        {/* --- QUIRKY TOOLBAR --- */}
        <div className="fixed top-4 right-4 z-[90] flex flex-row gap-2 sm:gap-3">
             <button 
                onClick={() => setIsPeopleOpen(true)} 
                className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                title="Who's here?"
             >
                <Users size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-blue-500" />
             </button>

             <button 
                onClick={() => setIsChatOpen(true)} 
                className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                title="Chat"
             >
                <MessageCircle size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-green-500" />
                {chatMessages.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
             </button>

             <button 
                onClick={handleClearPage} 
                className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                title="Clear Page"
             >
                <Eraser size={24} strokeWidth={2.5} className="text-rose-600" />
             </button>

             <button 
                onClick={onExit} 
                className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] flex items-center justify-center hover:scale-105 active:translate-y-1 transition-all"
                title="Exit"
             >
                <LogOut size={24} strokeWidth={2.5} className="text-yellow-400" />
             </button>
        </div>

        {/* --- STICKER MENU --- */}
        <StickerMenu 
            stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
            onAddStickerToCanvas={(src) => {
                const newS = { id: `s-${Date.now()}`, type: 'image' as const, src, x: window.innerWidth/2 - 50, y: window.scrollY + 300, rotation: (Math.random()*20)-10, scale: 1 };
                setStickers([...stickers, newS]);
                pushUpdates({ stickers: [...stickers, newS] });
            }}
            onUploadStickerToLibrary={(src) => {
                const newLib = [...customLibrary, {id:`c-${Date.now()}`, src, label:'Custom'}];
                setCustomLibrary(newLib);
                pushUpdates({ customLibrary: newLib });
            }}
            onDeleteStickerFromLibrary={handleDeleteLibraryItem}
        />
        
        {/* TRASH BIN */}
        <TrashBin isVisible={interaction.mode === 'DRAG' && interaction.targetId !== 'bucket-list'} isHovered={isOverTrash} />
        
        {/* TODO MODAL */}
        <TodoModal 
            isOpen={isTodoModalOpen} 
            onClose={()=>setIsTodoModalOpen(false)} 
            items={todoItems} 
            setItems={updateTodoItems} 
        />

        {/* --- HERO SECTION --- */}
        <div className="flex flex-col items-center gap-6 z-10 mt-24 sm:mt-16 mb-10 w-full max-w-4xl">
            <h1 className="text-5xl sm:text-7xl font-marker text-slate-800 mb-2 leading-tight text-center drop-shadow-sm">
                Counting down to Us
            </h1>
            <CountdownTimer timeLeft={timeLeft} />
        </div>

        {/* --- PHOTO --- */}
        <TapedPhoto imageSrc={photoData} onImageUpload={updatePhoto} />

        {/* --- QUOTE --- */}
        <div className="mt-8 mb-20 text-center z-30 opacity-90 max-w-lg px-6 relative transform -rotate-1">
             <div className="relative inline-block p-4">
                 <div className="absolute inset-0 bg-green-200/40 rounded-lg -rotate-1 scale-110 -z-10 blur-[1px]"></div>
                 <p className="font-marker text-2xl sm:text-4xl text-slate-800 leading-tight">
                    "Every second that ticks by is just one second closer to making more memories with you."
                 </p>
             </div>
             <div className="flex items-center justify-center gap-2 mt-4 text-rose-500">
                <span className="font-marker text-xl">Love always</span>
                <Heart size={20} fill="currentColor" className="animate-pulse" />
             </div>
        </div>

        {/* --- BUCKET LIST (Draggable) --- */}
        <div className="z-10 relative w-full flex justify-center mb-16 h-[300px]">
            <StickyNote 
                data={noteState} 
                onMouseDown={(e)=>handleInteractionStart(e,'bucket-list','DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,'bucket-list','RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,'bucket-list','ROTATE')} 
                onClick={()=>setIsTodoModalOpen(true)}
            >
                {/* Simplified view for note */}
                <div className="flex flex-col h-full">
                    <span className="font-bold text-2xl mb-2 text-rose-500 border-b-2 border-rose-100/50 pb-1">Bucket List</span>
                    {todoItems.length === 0 ? (
                        <p className="text-slate-400 text-lg italic mt-4 text-center">Tap edit to add dreams...</p>
                    ) : (
                        <ul className="space-y-1 overflow-hidden">
                            {todoItems.slice(0,5).map((i,k)=><li key={k} className="truncate">• {i}</li>)}
                            {todoItems.length > 5 && <li className="text-sm opacity-50 mt-1">...and {todoItems.length - 5} more</li>}
                        </ul>
                    )}
                </div>
            </StickyNote>
        </div>

        {/* --- CHAT BUBBLES --- */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 z-10 w-full mb-32 px-4 pointer-events-auto">
            <QuirkyBubble text={redBubbleText} setText={setRedBubbleText} color="red" rotation="-rotate-3" />
            <QuirkyBubble text={greenBubbleText} setText={setGreenBubbleText} color="green" rotation="rotate-3" />
        </div>

        {/* --- STICKERS --- */}
        {stickers.map(s => (
            <DraggableSticker 
                key={s.id} 
                data={s} 
                onMouseDown={(e)=>handleInteractionStart(e,s.id,'DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,s.id,'RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,s.id,'ROTATE')} 
            />
        ))}

        {/* --- MODALS --- */}
        <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={handleSendMessage} currentUser={currentUser} />
        <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

    </div>
  );
};

export default CountdownRoom;
