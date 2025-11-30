
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Users, LogOut, Eraser } from 'lucide-react';
import { calculateTimeLeft, TimeLeft, getNextAnniversaryDateString } from '../utils/time';
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

// Helper types
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
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE', stickerId: null, startMouse: {x:0,y:0}, startPos: {x:0,y:0}, 
    startScale: 1, startDistance: 0, startRotation: 0, startAngle: 0
  });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Sync Ref to avoid fetch loops
  const isSyncingRef = useRef(false);

  // --- SYNC ENGINE ---
  const syncRoom = async () => {
    if (isSyncingRef.current) return;
    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId: room.roomId } })
        });
        const data = await res.json();
        if (data.roomId) {
            isSyncingRef.current = true;
            setStickers(data.stickers);
            setTodoItems(data.todoItems);
            setNoteState(data.noteState);
            setRedBubbleText(data.redBubble);
            setGreenBubbleText(data.greenBubble);
            setPhotoData(data.photo);
            setCustomLibrary(data.customLibrary);
            setChatMessages(data.chatMessages);
            setMembers(data.members);
            setTimeout(() => { isSyncingRef.current = false; }, 100);
        }
    } catch (e) { console.error(e); }
  };

  const pushUpdates = useCallback(async (updates: any) => {
    if (isSyncingRef.current) return;
    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'SYNC_ROOM',
                payload: { roomId: room.roomId, updates }
            })
        });
    } catch (e) { console.error(e); }
  }, [apiUrl, room.roomId]);

  // Polling
  useEffect(() => {
    // Calc time left based on room target date
    const { month, day } = room.targetDate;
    const tick = () => setTimeLeft(calculateTimeLeft(month, day));
    tick();
    const timer = setInterval(tick, 1000);
    const poller = setInterval(syncRoom, 2000); // Poll every 2s
    return () => { clearInterval(timer); clearInterval(poller); };
  }, [room.roomId, room.targetDate]);

  // Auto-Save Effects (Debounced slightly by nature of React state updates + Polling architecture)
  useEffect(() => { pushUpdates({ stickers }); }, [stickers, pushUpdates]);
  useEffect(() => { pushUpdates({ todoItems }); }, [todoItems, pushUpdates]);
  useEffect(() => { pushUpdates({ noteState }); }, [noteState, pushUpdates]);
  useEffect(() => { pushUpdates({ redBubble: redBubbleText }); }, [redBubbleText, pushUpdates]);
  useEffect(() => { pushUpdates({ greenBubble: greenBubbleText }); }, [greenBubbleText, pushUpdates]);
  useEffect(() => { pushUpdates({ photo: photoData }); }, [photoData, pushUpdates]);
  useEffect(() => { pushUpdates({ customLibrary }); }, [customLibrary, pushUpdates]);
  useEffect(() => { pushUpdates({ chatMessages }); }, [chatMessages, pushUpdates]);


  // --- HANDLERS ---
  const handleClearPage = async () => {
    if(!window.confirm("Are you sure? This clears stickers, notes, and photos for everyone!")) return;
    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CLEAR_CANVAS', payload: { roomId: room.roomId } })
        });
        syncRoom(); // Refresh immediately
    } catch(e) {}
  };

  const handleSendMessage = (text: string) => {
    const msg = { id: Date.now(), user: currentUser, text, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, msg]);
  };

  const handleDeleteLibraryItem = (id: string) => {
      setCustomLibrary(prev => prev.filter(s => s.id !== id));
  };

  // --- INTERACTION LOGIC (Drag/Drop/Resize) ---
  // (Reused from previous App.tsx but simplified for brevity)
  const handleDragStart = (e: any, id: string) => {
      // ... same logic as before, calculating centers ...
      let target = id === 'bucket-list' ? {...noteState} : stickers.find(s=>s.id===id);
      if(!target) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setInteraction({
          mode: 'DRAG', stickerId: id, startMouse: {x:clientX, y:clientY},
          startPos: {x:target.x, y:target.y}, startScale: (target as any).scale, startDistance: 0,
          startRotation: (target as any).rotation, startAngle: 0
      });
  };

  const handleGlobalMove = useCallback((e: any) => {
      if(interaction.mode === 'IDLE' || !interaction.stickerId) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      if(interaction.mode === 'DRAG') {
          const dx = clientX - interaction.startMouse.x;
          const dy = clientY - interaction.startMouse.y;
          const nx = interaction.startPos.x + dx;
          const ny = interaction.startPos.y + dy;
          
          if(interaction.stickerId === 'bucket-list') setNoteState(p => ({...p, x:nx, y:ny}));
          else setStickers(p => p.map(s => s.id === interaction.stickerId ? {...s, x:nx, y:ny} : s));

          // Trash Check
          if(interaction.stickerId !== 'bucket-list') {
              const trashZone = { x: window.innerWidth/2, y: window.innerHeight-50, radius: 100 };
              const dist = Math.sqrt(Math.pow(clientX-trashZone.x, 2) + Math.pow(clientY-trashZone.y, 2));
              setIsOverTrash(dist < trashZone.radius);
          }
      }
      // ... Add Resize/Rotate logic similar to previous App.tsx if needed
  }, [interaction]);

  const handleGlobalEnd = useCallback(() => {
      if(interaction.mode === 'DRAG' && isOverTrash && interaction.stickerId !== 'bucket-list') {
          setStickers(p => p.filter(s => s.id !== interaction.stickerId));
      }
      setInteraction(p => ({...p, mode: 'IDLE', stickerId: null}));
      setIsOverTrash(false);
  }, [interaction, isOverTrash]);

  useEffect(() => {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, {passive:false});
      window.addEventListener('touchend', handleGlobalEnd);
      return () => {
          window.removeEventListener('mousemove', handleGlobalMove);
          window.removeEventListener('mouseup', handleGlobalEnd);
          window.removeEventListener('touchmove', handleGlobalMove);
          window.removeEventListener('touchend', handleGlobalEnd);
      };
  }, [handleGlobalMove, handleGlobalEnd]);


  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 relative overflow-x-hidden bg-grid-pattern pb-32">
        
        {/* TOP BAR */}
        <div className="fixed top-4 right-4 z-[90] flex gap-3">
             <button onClick={() => setIsPeopleOpen(true)} className="bg-white p-3 rounded-full border-2 border-slate-900 shadow-md hover:bg-slate-100">
                <Users size={20} />
             </button>
             <button onClick={() => setIsChatOpen(true)} className="bg-white p-3 rounded-full border-2 border-slate-900 shadow-md hover:bg-slate-100 relative">
                <MessageCircle size={20} />
                {chatMessages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border border-white"></span>}
             </button>
             <button onClick={handleClearPage} className="bg-rose-100 p-3 rounded-full border-2 border-rose-900 shadow-md hover:bg-rose-200 text-rose-900" title="Clear Canvas">
                <Eraser size={20} />
             </button>
             <button onClick={onExit} className="bg-slate-900 p-3 rounded-full border-2 border-slate-900 shadow-md hover:bg-slate-700 text-white" title="Exit Room">
                <LogOut size={20} />
             </button>
        </div>

        {/* --- MAIN CONTENT (Reused) --- */}
        <StickerMenu 
            stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
            onAddStickerToCanvas={(src) => {
                const newS = { id: `s-${Date.now()}`, type: 'image' as const, src, x: window.innerWidth/2, y: window.innerHeight/2, rotation: 0, scale: 1 };
                setStickers([...stickers, newS]);
            }}
            onUploadStickerToLibrary={(src) => setCustomLibrary(p => [...p, {id:`c-${Date.now()}`, src, label:'Custom'}])}
            onDeleteStickerFromLibrary={handleDeleteLibraryItem} // NEW
        />
        
        <TrashBin isVisible={interaction.mode==='DRAG'} isHovered={isOverTrash} />
        
        <TodoModal isOpen={isTodoModalOpen} onClose={()=>setIsTodoModalOpen(false)} items={todoItems} setItems={setTodoItems} />

        <div className="flex flex-col items-center gap-6 z-10 mt-20 sm:mt-8 mb-10 w-full max-w-4xl">
            <h1 className="text-5xl sm:text-7xl font-marker text-slate-800 mb-6 leading-tight text-center">Counting down to Us</h1>
            <CountdownTimer timeLeft={timeLeft} />
        </div>

        <TapedPhoto imageSrc={photoData} onImageUpload={setPhotoData} />

        <div className="mt-8 mb-12 text-center z-30 opacity-90 max-w-md px-4 relative transform -rotate-1">
             <div className="relative inline-block p-4">
                 <div className="absolute inset-0 bg-green-200/40 rounded-lg -rotate-1 scale-110 -z-10 blur-[1px]"></div>
                 <p className="font-marker text-3xl sm:text-4xl text-slate-800 leading-tight">"Every second that ticks by is just one second closer to making more memories with you."</p>
             </div>
             <div className="flex items-center justify-center gap-2 mt-4 text-rose-500"><span className="font-marker text-xl">Love always</span><Heart size={20} fill="currentColor" className="animate-pulse" /></div>
        </div>

        <div className="z-10 relative w-full flex justify-center mb-16">
            <StickyNote data={noteState} onMouseDown={(e)=>handleDragStart(e,'bucket-list')} onResizeStart={()=>{}} onRotateStart={()=>{}} onClick={()=>setIsTodoModalOpen(true)}>
                <span className="font-bold text-2xl mb-1 block text-rose-500 pb-2">Bucket List</span>
                <ul className="space-y-1">{todoItems.slice(0,4).map((i,k)=><li key={k} className="truncate">• {i}</li>)}</ul>
            </StickyNote>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 z-10 w-full mb-32 px-4">
            <QuirkyBubble text={redBubbleText} setText={setRedBubbleText} color="red" rotation="-rotate-3" />
            <QuirkyBubble text={greenBubbleText} setText={setGreenBubbleText} color="green" rotation="rotate-3" />
        </div>

        {stickers.map(s => (
            <DraggableSticker key={s.id} data={s} onMouseDown={handleDragStart} onResizeStart={()=>{}} onRotateStart={()=>{}} />
        ))}

        {/* MODALS */}
        <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={handleSendMessage} currentUser={currentUser} />
        <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

    </div>
  );
};

export default CountdownRoom;
