
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Users, LogOut, Eraser, Share2, Sparkles, X, Edit2, Check } from 'lucide-react';
import { calculateTimeLeft, TimeLeft, formatDateDisplay } from '../utils/time';
import CountdownTimer from './CountdownTimer';
import TapedPhoto from './TapedPhoto';
import StickyNote, { NoteData } from './StickyNote';
import DraggableSticker, { StickerData } from './DraggableSticker';
import StickerMenu from './StickerMenu';
import TrashBin from './TrashBin';
import TodoModal from './TodoModal';
import ChatDrawer from './ChatDrawer';
import PeopleList from './PeopleList';
import ShareModal from './ShareModal';
import Confetti from './Confetti';
import MusicPlayer from './MusicPlayer';
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
  targetId: string | null;
  startMouse: { x: number, y: number };
  initialData: { x: number, y: number, scale: number, rotation: number };
}

const CountdownRoom: React.FC<CountdownRoomProps> = ({ room, currentUser, apiUrl, onExit }) => {
  // --- CACHE HELPER ---
  const getCachedState = (key: string, fallback: any) => {
    try {
        const cached = localStorage.getItem(`room_data_${room.roomId}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            return parsed[key] !== undefined ? parsed[key] : fallback;
        }
    } catch (e) { }
    return fallback;
  };

  // --- STATE ---
  const [targetISO, setTargetISO] = useState(getCachedState('targetISO', room.targetISO || new Date().toISOString()));
  const [eventName, setEventName] = useState(getCachedState('eventName', room.eventName || 'Us'));
  const [quote, setQuote] = useState(getCachedState('quote', room.quote || "Every second that ticks by is just one second closer to making more memories with you."));
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetISO));
  
  const [stickers, setStickers] = useState<StickerData[]>(() => getCachedState('stickers', room.stickers || []));
  const [todoItems, setTodoItems] = useState<string[]>(() => getCachedState('todoItems', room.todoItems || []));
  const [noteState, setNoteState] = useState<NoteData>(() => getCachedState('noteState', room.noteState || { x: 0, y: 0, rotation: -2, scale: 1 }));
  const [photoData, setPhotoData] = useState<string>(() => getCachedState('photo', room.photo || 'us.png'));
  const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>(() => getCachedState('customLibrary', room.customLibrary || []));
  const [chatMessages, setChatMessages] = useState<any[]>(() => getCachedState('chatMessages', room.chatMessages || []));
  const [members, setMembers] = useState<string[]>(room.members || []);
  const [musicSrc, setMusicSrc] = useState<string>(() => getCachedState('musicSrc', room.musicSrc || ''));

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStickerMenuOpen, setIsStickerMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  
  // Interaction Engine State
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE', targetId: null, startMouse: {x:0,y:0}, initialData: {x:0,y:0,scale:1,rotation:0}
  });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Edit Modal Inputs
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editName, setEditName] = useState('');

  // --- SYNC CONTROL ---
  const lastInteractionTime = useRef(0);
  const isSavingRef = useRef(false);
  const isInteractingRef = useRef(false);
  const prevChatLenRef = useRef(chatMessages.length);

  const reportInteraction = () => {
      lastInteractionTime.current = Date.now();
  };

  // --- PERSIST CACHE ---
  useEffect(() => {
    const dataToCache = {
        stickers, todoItems, noteState, photo: photoData,
        quote, musicSrc, chatMessages, customLibrary,
        targetISO, eventName
    };
    localStorage.setItem(`room_data_${room.roomId}`, JSON.stringify(dataToCache));
  }, [stickers, todoItems, noteState, photoData, quote, musicSrc, chatMessages, customLibrary, targetISO, eventName, room.roomId]);


  // --- NOTIFICATIONS ---
  const triggerNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/clock.png' });
    }
  };

  // --- SYNC ENGINE ---
  const syncRoom = useCallback(async (force = false) => {
    // CRITICAL: Do not fetch if user is interacting, recently interacted, or CURRENTLY SAVING.
    // UNLESS 'force' is true (used on initial mount).
    if (!force) {
        if (isSavingRef.current || isInteractingRef.current || (Date.now() - lastInteractionTime.current < 4000)) {
            return;
        }
    }

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId: room.roomId } })
        });
        const data = await res.json();
        
        if (data.roomId) {
            setStickers(data.stickers || []);
            
            if (!isTodoModalOpen) {
                setTodoItems(data.todoItems || []);
            }
            
            setQuote(data.quote || "");
            setNoteState(data.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
            setPhotoData(data.photo || 'us.png');
            setMembers(data.members || []);
            setMusicSrc(data.musicSrc || '');
            setCustomLibrary(data.customLibrary || []);

            // Chat (Always sync)
            const newMsgs = data.chatMessages || [];
            if (newMsgs.length > prevChatLenRef.current) {
                const lastMsg = newMsgs[newMsgs.length - 1];
                setChatMessages(newMsgs);
                if (lastMsg.user !== currentUser) {
                    setHasUnreadMsg(true);
                    triggerNotification(`Message from ${lastMsg.user}`, lastMsg.text);
                }
                prevChatLenRef.current = newMsgs.length;
            }

            // Event Details
            if (!isEditMode) {
                setTargetISO(data.targetISO || room.targetISO);
                setEventName(data.eventName || 'Us');
            }
        }
    } catch (e) { console.error("Sync Error", e); }
  }, [apiUrl, room.roomId, currentUser, isTodoModalOpen, isEditMode, room.targetISO]);

  const pushUpdates = useCallback(async (updates: any) => {
    // Lock sync process immediately
    isSavingRef.current = true;
    reportInteraction();

    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'SYNC_ROOM',
                payload: { roomId: room.roomId, updates }
            })
        });
    } catch (e) { 
        console.error("Push Error", e); 
    } finally {
        // Keep lock for 3 seconds to ensure server consistency and prevent "disappearing" items
        setTimeout(() => {
            isSavingRef.current = false;
        }, 3000);
    }
  }, [apiUrl, room.roomId]);

  // Timer & Reset Logic
  useEffect(() => {
    // Force immediate sync on mount to get fresh data
    syncRoom(true);

    let notifiedComplete = false;
    const tick = () => {
        const left = calculateTimeLeft(targetISO);
        setTimeLeft(left);
        
        if (left.isAnniversary && !notifiedComplete) {
            triggerNotification("🎉 It's Time! 🎉", `The countdown to ${eventName} is over!`);
            notifiedComplete = true;
        }

        // Auto-Reset (> 24 hours past)
        const now = new Date();
        const target = new Date(targetISO);
        const diff = target.getTime() - now.getTime();
        
        if (diff < -86400000) {
             const newTarget = new Date(target);
             newTarget.setFullYear(newTarget.getFullYear() + 1);
             const newISO = newTarget.toISOString();
             setTargetISO(newISO);
             fetch(apiUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     action: 'UPDATE_ROOM_DETAILS',
                     payload: { roomId: room.roomId, eventName, targetISO: newISO }
                 })
             });
        }
    };
    
    tick();
    const timer = setInterval(tick, 1000);
    const poller = setInterval(() => syncRoom(false), 2000); 
    return () => { clearInterval(timer); clearInterval(poller); };
  }, [targetISO, eventName, apiUrl, room.roomId, syncRoom]);

  useEffect(() => {
    if (isChatOpen) setHasUnreadMsg(false);
  }, [isChatOpen]);

  // --- HANDLERS ---

  const handleTodoUpdate = (items: string[]) => {
      reportInteraction();
      setTodoItems(items);
      pushUpdates({ todoItems: items });
  };
  
  const handlePhotoUpdate = (data: string) => {
      reportInteraction();
      setPhotoData(data);
      pushUpdates({ photo: data });
  };
  
  const handleQuoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setQuote(e.target.value);
  };

  const handleMusicUpdate = (src: string) => {
      reportInteraction();
      setMusicSrc(src);
      pushUpdates({ musicSrc: src });
  };

  const handleClearPage = async () => {
    if(!window.confirm("Reset everything? (Photos, stickers, lists will be cleared)")) return;
    reportInteraction();
    isSavingRef.current = true;
    
    // Reset local
    setStickers([]);
    setTodoItems([]);
    setPhotoData('us.png');
    setMusicSrc('');
    setQuote("Every second that ticks by is just one second closer to making more memories with you.");
    
    await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_CANVAS', payload: { roomId: room.roomId } })
    });
    
    setTimeout(() => { isSavingRef.current = false; }, 3000);
  };

  // --- INTERACTION ENGINE (Drag/Drop) ---
  const handleInteractionStart = (e: any, id: string, mode: InteractionMode) => {
      e.preventDefault(); 
      e.stopPropagation();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let target: { x: number, y: number, scale: number, rotation: number } | undefined;
      if (id === 'bucket-list') target = noteState;
      else target = stickers.find(s => s.id === id);

      if (!target) return;
      isInteractingRef.current = true;
      reportInteraction();

      setInteraction({
          mode, targetId: id, startMouse: { x: clientX, y: clientY }, initialData: { ...target }
      });
  };

  const handleGlobalMove = useCallback((e: any) => {
      if (!isInteractingRef.current || interaction.mode === 'IDLE' || !interaction.targetId) return;
      reportInteraction();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - interaction.startMouse.x;
      const dy = clientY - interaction.startMouse.y;

      const updateLocal = (newData: Partial<typeof interaction.initialData>) => {
          if (interaction.targetId === 'bucket-list') setNoteState(prev => ({ ...prev, ...newData }));
          else setStickers(prev => prev.map(s => s.id === interaction.targetId ? { ...s, ...newData } : s));
      };

      if (interaction.mode === 'DRAG') {
          updateLocal({ x: interaction.initialData.x + dx, y: interaction.initialData.y + dy });
          if (interaction.targetId !== 'bucket-list') {
              const trashZone = { x: window.innerWidth/2, y: window.innerHeight - 80, radius: 80 };
              const dist = Math.sqrt(Math.pow(clientX - trashZone.x, 2) + Math.pow(clientY - trashZone.y, 2));
              setIsOverTrash(dist < trashZone.radius);
          }
      } else if (interaction.mode === 'RESIZE') {
           const dist = Math.sqrt(dx*dx + dy*dy);
           const factor = (dy > 0 ? 1 : -1) * (dist / 200); 
           const newScale = Math.max(0.5, Math.min(3, interaction.initialData.scale + factor));
           updateLocal({ scale: newScale });
      } else if (interaction.mode === 'ROTATE') {
           updateLocal({ rotation: interaction.initialData.rotation + (dx / 2) });
      }
  }, [interaction]);

  const handleGlobalEnd = useCallback(() => {
      if (!isInteractingRef.current) return;
      reportInteraction();
      
      if (interaction.mode === 'DRAG' && isOverTrash && interaction.targetId && interaction.targetId !== 'bucket-list') {
          // DELETE STICKER
          const newStickers = stickers.filter(s => s.id !== interaction.targetId);
          setStickers(newStickers);
          pushUpdates({ stickers: newStickers });
      } else {
          // SAVE MOVE
          if (interaction.targetId === 'bucket-list') pushUpdates({ noteState });
          else {
              pushUpdates({ stickers });
          }
      }
      
      isInteractingRef.current = false;
      setInteraction(prev => ({ ...prev, mode: 'IDLE', targetId: null }));
      setIsOverTrash(false);
  }, [interaction, isOverTrash, stickers, noteState, pushUpdates]);

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
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative overflow-x-hidden bg-grid-pattern pb-40">
        
        {timeLeft.isAnniversary && <Confetti />}

        {/* --- TOP HEADER ICONS --- */}
        <div className="fixed top-4 left-0 w-full z-[90] px-4 pointer-events-none flex justify-center">
             <div className="w-full max-w-lg flex justify-between items-center pointer-events-auto gap-2">
                 
                 <button onClick={() => setIsStickerMenuOpen(true)} className="w-11 h-11 bg-yellow-400 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Sparkles size={20} className="text-slate-900" />
                 </button>

                 <button onClick={() => setIsShareOpen(true)} className="w-11 h-11 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Share2 size={20} className="text-slate-900" />
                 </button>
                 
                 <button onClick={() => setIsPeopleOpen(true)} className="w-11 h-11 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Users size={20} className="text-slate-900" />
                 </button>
                 
                 <button onClick={() => setIsChatOpen(true)} className="relative w-11 h-11 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <MessageCircle size={20} className="text-slate-900" />
                    {hasUnreadMsg && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
                 </button>
                 
                 <button onClick={handleClearPage} className="w-11 h-11 bg-rose-100 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Eraser size={20} className="text-rose-600" />
                 </button>
                 
                 <button onClick={onExit} className="w-11 h-11 bg-slate-900 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_#fbbf24] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <LogOut size={20} className="text-yellow-400" />
                 </button>

             </div>
        </div>

        <StickerMenu 
            isOpen={isStickerMenuOpen}
            onClose={() => setIsStickerMenuOpen(false)}
            stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
            onAddStickerToCanvas={(src) => {
                const newS = { id: `s-${Date.now()}-${Math.random()}`, type: 'image' as const, src, x: window.innerWidth/2 - 50, y: window.scrollY + 300, rotation: (Math.random()*20)-10, scale: 1 };
                const updated = [...stickers, newS];
                setStickers(updated);
                // Trigger save immediately with lock
                pushUpdates({ stickers: updated });
            }}
            onUploadStickersToLibrary={(srcs) => {
                const newItems = srcs.map(src => ({
                    id: `c-${Date.now()}-${Math.random()}`, 
                    src, 
                    label: 'Custom'
                }));
                const newLib = [...newItems, ...customLibrary];
                setCustomLibrary(newLib);
                pushUpdates({ customLibrary: newLib });
            }}
            onDeleteStickerFromLibrary={(id) => {
                const newLib = customLibrary.filter(s => s.id !== id);
                setCustomLibrary(newLib);
                pushUpdates({ customLibrary: newLib });
            }}
        />
        
        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomId={room.roomId} pin={room.pin} />
        <TrashBin isVisible={interaction.mode === 'DRAG' && interaction.targetId !== 'bucket-list'} isHovered={isOverTrash} />
        <TodoModal isOpen={isTodoModalOpen} onClose={()=>setIsTodoModalOpen(false)} items={todoItems} setItems={handleTodoUpdate} />

        {/* --- EDIT DETAILS MODAL --- */}
        {isEditMode && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-marker text-3xl">Edit Countdown</h3>
                        <button onClick={() => setIsEditMode(false)}><X size={28} /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="font-bold text-xs uppercase text-slate-400">Title</label>
                            <input type="text" value={editName || eventName} onChange={e => setEditName(e.target.value)} className="w-full border-2 border-slate-900 rounded-lg p-2 font-hand font-bold text-xl" />
                        </div>
                        <div>
                             <label className="font-bold text-xs uppercase text-slate-400">Date</label>
                            <input type="date" value={editDate || targetISO.split('T')[0]} onChange={e => setEditDate(e.target.value)} className="w-full border-2 border-slate-900 rounded-lg p-2 font-hand font-bold text-xl" />
                        </div>
                        <div>
                             <label className="font-bold text-xs uppercase text-slate-400">Time</label>
                            <input type="time" value={editTime || new Date(targetISO).toTimeString().slice(0, 5)} onChange={e => setEditTime(e.target.value)} className="w-full border-2 border-slate-900 rounded-lg p-2 font-hand font-bold text-xl" />
                        </div>
                        <button 
                            onClick={() => {
                                const d = editDate || targetISO.split('T')[0];
                                const t = editTime || '00:00';
                                const combined = new Date(`${d}T${t}`);
                                const newISO = combined.toISOString();
                                setTargetISO(newISO);
                                setEventName(editName || eventName);
                                setIsEditMode(false);
                                pushUpdates({ eventName: editName || eventName, targetISO: newISO });
                            }} 
                            className="w-full bg-slate-900 text-yellow-400 py-3 rounded-lg font-bold text-xl hover:scale-105 transition-transform flex justify-center gap-2"
                        >
                            <Check /> Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN CONTENT --- */}
        <div className="flex flex-col items-center justify-center z-10 mt-24 mb-10 w-full max-w-4xl px-2">
            
            <div className="inline-flex items-center justify-center bg-slate-900 text-sky-200 px-4 py-1.5 rounded-full border-2 border-slate-900 shadow-sm mb-4 transform -rotate-1">
                 <span className="font-bold font-sans text-[10px] tracking-widest uppercase mr-2 text-yellow-400 shrink-0">Target:</span>
                 <span className="font-hand font-bold text-sm uppercase tracking-wide">
                    {formatDateDisplay(targetISO)}
                 </span>
            </div>

            <span className="text-2xl sm:text-3xl font-marker text-slate-500 mb-1 text-center">Counting down to</span>
            
            <div className="relative group flex items-center justify-center gap-3 mb-4">
                <h1 className="text-[10vw] sm:text-6xl md:text-7xl font-marker text-slate-900 leading-none drop-shadow-sm text-center">
                    {eventName}
                </h1>
                <button 
                    onClick={() => setIsEditMode(true)}
                    className="opacity-50 group-hover:opacity-100 hover:bg-yellow-200 p-2 rounded-full transition-all"
                    title="Edit Countdown"
                >
                    <Edit2 size={24} className="text-slate-600" />
                </button>
            </div>

            {/* INSTAGRAM STYLE MUSIC PLAYER */}
            <MusicPlayer src={musicSrc} onUpload={handleMusicUpdate} onRemove={() => handleMusicUpdate('')} />
            
            <div className="mt-4 w-full px-1">
                <CountdownTimer timeLeft={timeLeft} />
            </div>
        </div>

        <TapedPhoto imageSrc={photoData} onImageUpload={handlePhotoUpdate} />

        {/* --- EXPANDING GREEN CARD --- */}
        <div className="mt-8 mb-12 w-full max-w-lg px-4 relative transform -rotate-1 group z-30">
             <div className="relative w-full">
                 <div className="absolute inset-0 bg-green-100/60 rounded-xl -rotate-1 scale-[1.02] -z-10 blur-[1px]"></div>
                 
                 {/* Auto-growing Textarea */}
                 <div 
                    className="w-full min-h-[100px] p-6 bg-transparent text-center font-marker text-2xl sm:text-3xl text-slate-800 leading-relaxed outline-none whitespace-pre-wrap"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        const val = e.currentTarget.innerText;
                        if (val !== quote) {
                            setQuote(val);
                            pushUpdates({ quote: val });
                        }
                    }}
                 >
                    {quote}
                 </div>

             </div>
             <div className="flex items-center justify-center gap-2 mt-2 text-rose-500 opacity-80">
                <Heart size={16} fill="currentColor" />
             </div>
        </div>

        {/* --- BUCKET LIST STICKY NOTE --- */}
        <div className="z-10 relative w-full flex justify-center mb-40 min-h-[300px]">
            <StickyNote 
                data={noteState} 
                onMouseDown={(e)=>handleInteractionStart(e,'bucket-list','DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,'bucket-list','RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,'bucket-list','ROTATE')} 
                onClick={()=>setIsTodoModalOpen(true)}
            >
                <div className="flex flex-col h-full w-full">
                    <span className="font-bold text-2xl mb-4 text-rose-500 border-b-2 border-rose-100/50 pb-1 text-center">Bucket List</span>
                    
                    {/* FULL LIST RENDERED */}
                    <ul className="space-y-1 w-full">
                        {todoItems.length === 0 ? (
                            <li className="text-slate-400 text-lg italic text-center py-4">Tap to add dreams...</li>
                        ) : (
                            todoItems.map((item, k) => (
                                <li key={k} className="leading-tight flex items-start text-left text-lg">
                                    <span className="mr-2">•</span>
                                    <span className="break-words">{item}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </StickyNote>
        </div>

        {/* STICKERS */}
        {stickers.map(s => (
            <DraggableSticker 
                key={s.id} 
                data={s} 
                onMouseDown={(e)=>handleInteractionStart(e,s.id,'DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,s.id,'RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,s.id,'ROTATE')} 
            />
        ))}

        <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={(text) => {
            const msg = { id: Date.now(), user: currentUser, text, timestamp: new Date().toISOString() };
            const newMsgs = [...chatMessages, msg];
            setChatMessages(newMsgs);
            prevChatLenRef.current = newMsgs.length;
            pushUpdates({ chatMessages: newMsgs });
        }} currentUser={currentUser} />
        
        <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

    </div>
  );
};

export default CountdownRoom;
