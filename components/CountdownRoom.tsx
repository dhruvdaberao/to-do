
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Users, LogOut, Eraser, Share2, Sparkles, X, Save, Settings, Bell } from 'lucide-react';
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
import StatusCard from './StatusCard';
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
  // --- STATE ---
  const [targetISO, setTargetISO] = useState(room.targetISO || new Date().toISOString());
  const [eventName, setEventName] = useState(room.eventName || 'Us');
  const [quote, setQuote] = useState(room.quote || "Every second that ticks by is just one second closer to making more memories with you.");
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(room.targetISO || new Date().toISOString()));
  
  // Synced Data
  const [stickers, setStickers] = useState<StickerData[]>(room.stickers || []);
  const [todoItems, setTodoItems] = useState<string[]>(room.todoItems || []);
  const [noteState, setNoteState] = useState<NoteData>(room.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
  const [photoData, setPhotoData] = useState<string>(room.photo || 'us.png');
  const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>(room.customLibrary || []);
  const [chatMessages, setChatMessages] = useState<any[]>(room.chatMessages || []);
  const [members, setMembers] = useState<string[]>(room.members || []);
  const [musicSrc, setMusicSrc] = useState<string>(room.musicSrc || '');
  const [statusCard, setStatusCard] = useState(room.statusCard || { image: '', caption: 'Current Vibe', user: '' });

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStickerMenuOpen, setIsStickerMenuOpen] = useState(false);
  const [isEditCountdownOpen, setIsEditCountdownOpen] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Interaction Engine State
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE', targetId: null, startMouse: {x:0,y:0}, initialData: {x:0,y:0,scale:1,rotation:0}
  });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Edit Modal State
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editName, setEditName] = useState('');

  // Refs
  const isInteractingRef = useRef(false);
  const lastLocalUpdateRef = useRef<number>(0);
  const lastLibraryUpdateRef = useRef<number>(0); // Specific ref for library sync safety
  const prevChatLenRef = useRef(room.chatMessages?.length || 0);
  const prevTodoLenRef = useRef(room.todoItems?.length || 0);
  const prevStatusRef = useRef<string>(JSON.stringify(room.statusCard));

  // Refs to access current state inside intervals
  const isTodoModalOpenRef = useRef(isTodoModalOpen);
  const isEditCountdownOpenRef = useRef(isEditCountdownOpen);
  const quoteRef = useRef(quote);

  useEffect(() => { isTodoModalOpenRef.current = isTodoModalOpen; }, [isTodoModalOpen]);
  useEffect(() => { isEditCountdownOpenRef.current = isEditCountdownOpen; }, [isEditCountdownOpen]);
  useEffect(() => { quoteRef.current = quote; }, [quote]);

  // --- NOTIFICATIONS ---
  const requestNotifyPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(p => {
          if (p === 'granted') {
              setNotificationsEnabled(true);
              new Notification("Notifications Enabled!", { body: "We'll let you know when things happen.", icon: '/clock.png' });
          }
      });
    }
  };

  const triggerNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/clock.png' });
    }
  };

  // --- SYNC ENGINE ---
  const syncRoom = async () => {
    if (isInteractingRef.current) return;
    if (Date.now() - lastLocalUpdateRef.current < 5000) return;

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId: room.roomId } })
        });
        const data = await res.json();
        if (data.roomId) {
            // Safety check again before applying
            if (!isInteractingRef.current && (Date.now() - lastLocalUpdateRef.current > 5000)) {
                
                setStickers(data.stickers || []);
                setNoteState(data.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
                setPhotoData(data.photo || 'us.png');
                setMembers(data.members || []);
                setMusicSrc(data.musicSrc || '');

                // Custom Library Sync Safety
                if (Date.now() - lastLibraryUpdateRef.current > 5000) {
                     setCustomLibrary(data.customLibrary || []);
                }
                
                // --- NOTIFICATION TRIGGERS ---
                // 1. Chat
                const newMsgs = data.chatMessages || [];
                if (newMsgs.length > prevChatLenRef.current) {
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    setChatMessages(newMsgs);
                    if (lastMsg.user !== currentUser) {
                        setHasUnreadMsg(true);
                        triggerNotification(`New Message from ${lastMsg.user}`, lastMsg.text);
                    }
                    prevChatLenRef.current = newMsgs.length;
                }

                // 2. Todo List
                const newTodos = data.todoItems || [];
                if (!isTodoModalOpenRef.current) {
                    setTodoItems(newTodos);
                    if (newTodos.length > prevTodoLenRef.current) {
                        triggerNotification("Bucket List Updated!", "A new dream was added.");
                    } else if (newTodos.length < prevTodoLenRef.current && prevTodoLenRef.current > 0) {
                        // triggerNotification("Bucket List Checked!", "One item done!"); // Optional
                    }
                    prevTodoLenRef.current = newTodos.length;
                }

                // 3. Status Card
                const newStatus = data.statusCard || { image: '', caption: 'Current Vibe', user: '' };
                const newStatusStr = JSON.stringify(newStatus);
                if (newStatusStr !== prevStatusRef.current) {
                    setStatusCard(newStatus);
                    if (newStatus.user && newStatus.user !== currentUser) {
                        triggerNotification("Vibe Check!", `${newStatus.user} updated the status.`);
                    }
                    prevStatusRef.current = newStatusStr;
                }

                // Guard: Don't update event details while editing
                if (!isEditCountdownOpenRef.current) {
                    setTargetISO(data.targetISO || room.targetISO);
                    setEventName(data.eventName || 'Us');
                }
                
                if (data.quote && data.quote !== quoteRef.current) {
                    setQuote(data.quote);
                }
            }
        }
    } catch (e) { console.error("Sync Error", e); }
  };

  const pushUpdates = useCallback(async (updates: any) => {
    lastLocalUpdateRef.current = Date.now();
    
    // If pushing library updates, set specific ref
    if (updates.customLibrary) {
        lastLibraryUpdateRef.current = Date.now();
    }

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

  // Timer & Reset Logic
  useEffect(() => {
    let notifiedComplete = false;
    const tick = () => {
        const left = calculateTimeLeft(targetISO);
        setTimeLeft(left);
        
        // Notification for Completion (Once)
        if (left.isAnniversary && !notifiedComplete) {
            triggerNotification("🎉 It's Time! 🎉", `The countdown to ${eventName} is over! Enjoy the moment.`);
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
    const poller = setInterval(syncRoom, 2000); 
    return () => { clearInterval(timer); clearInterval(poller); };
  }, [targetISO, eventName, apiUrl, room.roomId]);

  useEffect(() => {
    if (isChatOpen) setHasUnreadMsg(false);
  }, [isChatOpen]);

  const updateTodoItems = (items: string[]) => {
      setTodoItems(items);
      prevTodoLenRef.current = items.length; // Update local ref immediately so we don't notify ourselves
      pushUpdates({ todoItems: items });
  };
  
  const updatePhoto = (data: string) => {
      setPhotoData(data);
      pushUpdates({ photo: data });
  };

  const updateStatusCard = (data: { image: string, caption: string, user: string }) => {
      setStatusCard(data);
      prevStatusRef.current = JSON.stringify(data);
      pushUpdates({ statusCard: data });
  };
  
  const handleQuoteBlur = () => {
      pushUpdates({ quote });
  };

  const handleClearPage = async () => {
    if(!window.confirm("Clear the whole page? This cannot be undone.")) return;
    setStickers([]);
    setTodoItems([]);
    setPhotoData('us.png');
    setMusicSrc('');
    setStatusCard({ image: '', caption: 'Current Vibe', user: '' });
    setQuote("Every second that ticks by is just one second closer to making more memories with you.");
    lastLocalUpdateRef.current = Date.now();
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
    prevChatLenRef.current = newMsgs.length;
    pushUpdates({ chatMessages: newMsgs });
  };

  // --- INTERACTION ENGINE ---
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
      lastLocalUpdateRef.current = Date.now(); 

      setInteraction({
          mode, targetId: id, startMouse: { x: clientX, y: clientY }, initialData: { ...target }
      });
  };

  const handleGlobalMove = useCallback((e: any) => {
      if (!isInteractingRef.current || interaction.mode === 'IDLE' || !interaction.targetId) return;
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
      
      if (interaction.mode === 'DRAG' && isOverTrash && interaction.targetId && interaction.targetId !== 'bucket-list') {
          const newStickers = stickers.filter(s => s.id !== interaction.targetId);
          setStickers(newStickers);
          pushUpdates({ stickers: newStickers });
      } else {
          if (interaction.targetId === 'bucket-list') pushUpdates({ noteState });
          else pushUpdates({ stickers });
      }
      
      isInteractingRef.current = false;
      lastLocalUpdateRef.current = Date.now();
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
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 relative overflow-x-hidden bg-grid-pattern pb-40">
        
        {timeLeft.isAnniversary && <Confetti />}

        {/* --- SETTINGS BUTTON (Left Side) --- */}
        <div className="fixed top-4 left-4 z-[90]">
            <button 
                onClick={() => setIsEditCountdownOpen(true)}
                className="group relative bg-yellow-300 text-slate-900 border-4 border-slate-900 rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:scale-105 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 transform -rotate-2 hover:rotate-0"
            >
                <Settings size={24} strokeWidth={2.5} />
                <span className="font-marker text-xl hidden sm:inline">Settings</span>
            </button>
        </div>

        {/* --- TOOLBAR (Right Side) --- */}
        <div className="fixed top-4 right-4 z-[90] flex flex-row gap-2 sm:gap-3 flex-wrap justify-end pl-24 sm:pl-0">
             <button onClick={() => setIsStickerMenuOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-yellow-400 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Sparkles size={24} strokeWidth={2.5} className="text-slate-900" />
             </button>
             <button onClick={() => setIsShareOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Share2 size={24} strokeWidth={2.5} className="text-slate-900" />
             </button>
             <button onClick={() => setIsPeopleOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Users size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-blue-500" />
             </button>
             <button onClick={() => setIsChatOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <MessageCircle size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-green-500" />
                {hasUnreadMsg && <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
             </button>
             <button onClick={handleClearPage} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Eraser size={24} strokeWidth={2.5} className="text-rose-600" />
             </button>
             <button onClick={onExit} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] flex items-center justify-center hover:scale-105 active:translate-y-1 transition-all">
                <LogOut size={24} strokeWidth={2.5} className="text-yellow-400" />
             </button>
        </div>

        <StickerMenu 
            isOpen={isStickerMenuOpen}
            onClose={() => setIsStickerMenuOpen(false)}
            stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
            onAddStickerToCanvas={(src) => {
                const newS = { id: `s-${Date.now()}-${Math.random()}`, type: 'image' as const, src, x: window.innerWidth/2 - 50, y: window.scrollY + 300, rotation: (Math.random()*20)-10, scale: 1 };
                setStickers(prev => [...prev, newS]);
                pushUpdates({ stickers: [...stickers, newS] });
            }}
            onUploadStickerToLibrary={(src) => {
                // Add new sticker to start of list
                const newLib = [{id:`c-${Date.now()}-${Math.random()}`, src, label:'Custom'}, ...customLibrary];
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
        <TodoModal isOpen={isTodoModalOpen} onClose={()=>setIsTodoModalOpen(false)} items={todoItems} setItems={updateTodoItems} />

        {/* SETTINGS MODAL */}
        {isEditCountdownOpen && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden transform rotate-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-marker text-3xl">Edit Details</h3>
                        <button onClick={() => setIsEditCountdownOpen(false)}><X size={28} /></button>
                    </div>
                    
                    {/* Notification Enable Button */}
                    <button 
                        onClick={requestNotifyPermission}
                        className={`w-full mb-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 border-2 transition-all
                            ${notificationsEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-yellow-100 hover:text-slate-900 hover:border-yellow-400'}
                        `}
                    >
                        <Bell size={20} />
                        {notificationsEnabled ? 'Notifications Active' : 'Enable Notifications'}
                    </button>

                    <div className="space-y-4">
                        <div>
                            <label className="font-bold text-sm text-slate-500 uppercase">Event Name</label>
                            <input type="text" value={editName || eventName} onChange={e => setEditName(e.target.value)} className="w-full border-2 border-slate-900 rounded-lg p-2 font-hand font-bold text-xl" />
                        </div>
                        <div>
                            <label className="font-bold text-sm text-slate-500 uppercase">Target Date</label>
                            <input type="date" value={editDate || targetISO.split('T')[0]} onChange={e => setEditDate(e.target.value)} className="w-full border-2 border-slate-900 rounded-lg p-2 font-hand font-bold text-xl" />
                        </div>
                        <div>
                            <label className="font-bold text-sm text-slate-500 uppercase">Target Time</label>
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
                                setIsEditCountdownOpen(false);
                                lastLocalUpdateRef.current = Date.now();
                                fetch(apiUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'UPDATE_ROOM_DETAILS',
                                        payload: { roomId: room.roomId, eventName: editName || eventName, targetISO: newISO }
                                    })
                                });
                            }} 
                            className="w-full bg-slate-900 text-yellow-400 py-3 rounded-lg font-bold text-xl shadow-[4px_4px_0px_0px_#facc15] hover:translate-y-0.5 active:shadow-none transition-all flex justify-center gap-2"
                        >
                            <Save /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- HERO SECTION --- */}
        <div className="flex flex-col items-center justify-center z-10 mt-20 sm:mt-12 mb-10 w-full max-w-4xl px-2">
            
            <div className="inline-flex items-center justify-center bg-slate-900 text-sky-200 px-4 py-2 sm:px-6 sm:py-2 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] mb-4 transform -rotate-1 max-w-[95vw] sm:max-w-full">
                 <span className="font-bold font-sans text-[10px] sm:text-xs tracking-widest uppercase mr-2 text-yellow-400 shrink-0">Target:</span>
                 <span className="font-hand font-bold text-md sm:text-xl uppercase tracking-wide leading-tight break-words text-center">
                    {formatDateDisplay(targetISO)}
                 </span>
            </div>

            <span className="text-2xl sm:text-3xl md:text-4xl font-marker text-slate-500 mb-2 text-center">Counting down to</span>
            
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 w-full px-2">
                <h1 className="text-[12vw] sm:text-7xl md:text-8xl font-marker text-slate-900 leading-none drop-shadow-sm text-center break-words max-w-full">
                    {eventName}
                </h1>
            </div>

            {/* --- MUSIC PLAYER BAR (Between Title and Timer) --- */}
            <MusicPlayer src={musicSrc} onUpload={(src) => { setMusicSrc(src); pushUpdates({ musicSrc: src }); }} />
            
            <div className="mt-4 w-full px-1">
                <CountdownTimer timeLeft={timeLeft} />
            </div>
        </div>

        <TapedPhoto imageSrc={photoData} onImageUpload={updatePhoto} />

        {/* --- EDITABLE GREEN CARD --- */}
        <div className="mt-8 mb-20 text-center z-30 max-w-lg px-6 relative transform -rotate-1 group w-full">
             <div className="relative inline-block p-6 w-full">
                 <div className="absolute inset-0 bg-green-200/40 rounded-lg -rotate-1 scale-110 -z-10 blur-[1px] border-2 border-transparent group-hover:border-green-300/50 transition-colors"></div>
                 <textarea
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    onBlur={handleQuoteBlur}
                    placeholder="Write a message here..."
                    className="w-full bg-transparent border-none text-center font-marker text-2xl sm:text-4xl text-slate-800 leading-tight focus:outline-none resize-none overflow-hidden placeholder:text-slate-400/50"
                    rows={3}
                    style={{ minHeight: '120px' }}
                 />
             </div>
             <div className="flex items-center justify-center gap-2 mt-4 text-rose-500">
                <span className="font-marker text-xl">Love always</span>
                <Heart size={20} fill="currentColor" className="animate-pulse" />
             </div>
        </div>

        <div className="z-10 relative w-full flex justify-center mb-16 h-[300px]">
            <StickyNote 
                data={noteState} 
                onMouseDown={(e)=>handleInteractionStart(e,'bucket-list','DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,'bucket-list','RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,'bucket-list','ROTATE')} 
                onClick={()=>setIsTodoModalOpen(true)}
            >
                <div className="flex flex-col h-full w-full overflow-hidden">
                    <span className="font-bold text-2xl mb-4 text-rose-500 border-b-2 border-rose-100/50 pb-1">Bucket List</span>
                    {todoItems.length === 0 ? (
                        <p className="text-slate-400 text-lg italic mt-4 text-center">Tap edit to add dreams...</p>
                    ) : (
                        <ul className="space-y-1 overflow-hidden">
                            {todoItems.slice(0, 5).map((item,k) => (
                                <li key={k} className="break-words leading-tight truncate">• {item}</li>
                            ))}
                            {todoItems.length > 5 && <li className="text-slate-400 italic text-sm mt-1">...and {todoItems.length - 5} more</li>}
                        </ul>
                    )}
                </div>
            </StickyNote>
        </div>

        {/* --- STATUS CARD (Fixed at bottom) --- */}
        <StatusCard data={statusCard} onUpdate={updateStatusCard} currentUser={currentUser} />

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

        <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={handleSendMessage} currentUser={currentUser} />
        <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

    </div>
  );
};

export default CountdownRoom;
