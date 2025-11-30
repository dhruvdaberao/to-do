
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Heart, MessageCircle, Users, LogOut, Eraser, Share2, Sparkles } from 'lucide-react';
// import { calculateTimeLeft, TimeLeft, formatDateDisplay } from '../utils/time';
// import CountdownTimer from './CountdownTimer';
// import TapedPhoto from './TapedPhoto';
// import StickyNote, { NoteData } from './StickyNote';
// import DraggableSticker, { StickerData } from './DraggableSticker';
// import StickerMenu from './StickerMenu';
// import TrashBin from './TrashBin';
// import TodoModal from './TodoModal';
// import ChatDrawer from './ChatDrawer';
// import PeopleList from './PeopleList';
// import ShareModal from './ShareModal';
// import Confetti from './Confetti';
// import { AVAILABLE_STICKERS, StickerDefinition } from './Doodles';

// interface CountdownRoomProps {
//   room: any;
//   currentUser: string;
//   apiUrl: string;
//   onExit: () => void;
// }

// // Interaction State Types
// type InteractionMode = 'IDLE' | 'DRAG' | 'RESIZE' | 'ROTATE';
// interface InteractionState {
//   mode: InteractionMode;
//   targetId: string | null;
//   startMouse: { x: number, y: number };
//   initialData: { x: number, y: number, scale: number, rotation: number };
// }

// const CountdownRoom: React.FC<CountdownRoomProps> = ({ room, currentUser, apiUrl, onExit }) => {
//   // --- STATE ---
//   const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, isAnniversary: false });
  
//   // Synced Data
//   const [stickers, setStickers] = useState<StickerData[]>(room.stickers || []);
//   const [todoItems, setTodoItems] = useState<string[]>(room.todoItems || []);
//   const [noteState, setNoteState] = useState<NoteData>(room.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
//   const [photoData, setPhotoData] = useState<string>(room.photo || 'us.png');
//   const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>(room.customLibrary || []);
//   const [chatMessages, setChatMessages] = useState<any[]>(room.chatMessages || []);
//   const [members, setMembers] = useState<string[]>(room.members || []);

//   // UI State
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [isPeopleOpen, setIsPeopleOpen] = useState(false);
//   const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
//   const [isShareOpen, setIsShareOpen] = useState(false);
//   const [isStickerMenuOpen, setIsStickerMenuOpen] = useState(false);
//   const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  
//   // Interaction Engine State
//   const [interaction, setInteraction] = useState<InteractionState>({
//     mode: 'IDLE', targetId: null, startMouse: {x:0,y:0}, initialData: {x:0,y:0,scale:1,rotation:0}
//   });
//   const [isOverTrash, setIsOverTrash] = useState(false);

//   // Refs
//   const isInteractingRef = useRef(false);
//   const isSyncingRef = useRef(false);
//   const lastChatLenRef = useRef(room.chatMessages?.length || 0);

//   // --- NOTIFICATIONS & PERMISSIONS ---
//   useEffect(() => {
//     if ("Notification" in window) {
//       if (Notification.permission !== "granted") {
//         Notification.requestPermission();
//       }
//     }
//   }, []);

//   const triggerNotification = (title: string, body: string) => {
//     if ("Notification" in window && Notification.permission === "granted") {
//         new Notification(title, { body, icon: '/clock.png' });
//     }
//   };

//   // --- SYNC ENGINE ---
//   const syncRoom = async () => {
//     if (isInteractingRef.current || isSyncingRef.current) return;

//     try {
//         const res = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId: room.roomId } })
//         });
//         const data = await res.json();
//         if (data.roomId) {
//             isSyncingRef.current = true;
//             if (!isInteractingRef.current) {
//                 setStickers(data.stickers || []);
//                 setTodoItems(data.todoItems || []);
//                 setNoteState(data.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
//                 setPhotoData(data.photo || 'us.png');
//                 setCustomLibrary(data.customLibrary || []);
//                 setMembers(data.members || []);
                
//                 // Chat Handling
//                 const newMsgs = data.chatMessages || [];
//                 if (newMsgs.length > lastChatLenRef.current) {
//                     const lastMsg = newMsgs[newMsgs.length - 1];
//                     setChatMessages(newMsgs);
//                     // Only notify if it's NOT my message
//                     if (lastMsg.user !== currentUser) {
//                         setHasUnreadMsg(true);
//                         triggerNotification("New Message!", `${lastMsg.user}: ${lastMsg.text}`);
//                     }
//                     lastChatLenRef.current = newMsgs.length;
//                 }
//             }
//             setTimeout(() => { isSyncingRef.current = false; }, 50);
//         }
//     } catch (e) { console.error("Sync Error", e); }
//   };

//   const pushUpdates = useCallback(async (updates: any) => {
//     try {
//         await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 action: 'SYNC_ROOM',
//                 payload: { roomId: room.roomId, updates }
//             })
//         });
//     } catch (e) { console.error("Push Error", e); }
//   }, [apiUrl, room.roomId]);

//   // Polling & Timer
//   useEffect(() => {
//     const target = room.targetISO || new Date(room.targetDate.year, room.targetDate.month, room.targetDate.day).toISOString();
    
//     const tick = () => setTimeLeft(calculateTimeLeft(target));
//     tick();
//     const timer = setInterval(tick, 1000);
//     const poller = setInterval(syncRoom, 1000); 
//     return () => { clearInterval(timer); clearInterval(poller); };
//   }, [room]);

//   useEffect(() => {
//     if (isChatOpen) setHasUnreadMsg(false);
//   }, [isChatOpen]);

//   const updateTodoItems = (items: string[]) => {
//       setTodoItems(items);
//       pushUpdates({ todoItems: items });
//       triggerNotification("Bucket List Updated", `${currentUser} updated the list!`);
//   };
  
//   const updatePhoto = (data: string) => {
//       setPhotoData(data);
//       pushUpdates({ photo: data });
//   };

//   const handleClearPage = async () => {
//     if(!window.confirm("Clear the whole page? This cannot be undone.")) return;
//     setStickers([]);
//     setTodoItems([]);
//     setPhotoData('us.png');
//     await fetch(apiUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ action: 'CLEAR_CANVAS', payload: { roomId: room.roomId } })
//     });
//   };

//   const handleSendMessage = (text: string) => {
//     const msg = { id: Date.now(), user: currentUser, text, timestamp: new Date().toISOString() };
//     const newMsgs = [...chatMessages, msg];
//     setChatMessages(newMsgs);
//     lastChatLenRef.current = newMsgs.length;
//     pushUpdates({ chatMessages: newMsgs });
//   };

//   const handleDeleteLibraryItem = (id: string) => {
//       const newLib = customLibrary.filter(s => s.id !== id);
//       setCustomLibrary(newLib);
//       pushUpdates({ customLibrary: newLib });
//   };

//   // --- INTERACTION ENGINE ---

//   const handleInteractionStart = (e: any, id: string, mode: InteractionMode) => {
//       e.preventDefault(); 
//       e.stopPropagation();
//       const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//       const clientY = e.touches ? e.touches[0].clientY : e.clientY;

//       let target: { x: number, y: number, scale: number, rotation: number } | undefined;
//       if (id === 'bucket-list') target = noteState;
//       else target = stickers.find(s => s.id === id);

//       if (!target) return;
//       isInteractingRef.current = true; 
//       setInteraction({
//           mode, targetId: id, startMouse: { x: clientX, y: clientY }, initialData: { ...target }
//       });
//   };

//   const handleGlobalMove = useCallback((e: any) => {
//       if (!isInteractingRef.current || interaction.mode === 'IDLE' || !interaction.targetId) return;
//       const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//       const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//       const dx = clientX - interaction.startMouse.x;
//       const dy = clientY - interaction.startMouse.y;

//       const updateLocal = (newData: Partial<typeof interaction.initialData>) => {
//           if (interaction.targetId === 'bucket-list') setNoteState(prev => ({ ...prev, ...newData }));
//           else setStickers(prev => prev.map(s => s.id === interaction.targetId ? { ...s, ...newData } : s));
//       };

//       if (interaction.mode === 'DRAG') {
//           updateLocal({ x: interaction.initialData.x + dx, y: interaction.initialData.y + dy });
//           if (interaction.targetId !== 'bucket-list') {
//               const trashZone = { x: window.innerWidth/2, y: window.innerHeight - 80, radius: 80 };
//               const dist = Math.sqrt(Math.pow(clientX - trashZone.x, 2) + Math.pow(clientY - trashZone.y, 2));
//               setIsOverTrash(dist < trashZone.radius);
//           }
//       } else if (interaction.mode === 'RESIZE') {
//            const dist = Math.sqrt(dx*dx + dy*dy);
//            const factor = (dy > 0 ? 1 : -1) * (dist / 200); 
//            const newScale = Math.max(0.5, Math.min(3, interaction.initialData.scale + factor));
//            updateLocal({ scale: newScale });
//       } else if (interaction.mode === 'ROTATE') {
//            updateLocal({ rotation: interaction.initialData.rotation + (dx / 2) });
//       }
//   }, [interaction]);

//   const handleGlobalEnd = useCallback(() => {
//       if (!isInteractingRef.current) return;
//       if (interaction.mode === 'DRAG' && isOverTrash && interaction.targetId && interaction.targetId !== 'bucket-list') {
//           const newStickers = stickers.filter(s => s.id !== interaction.targetId);
//           setStickers(newStickers);
//           pushUpdates({ stickers: newStickers });
//       } else {
//           if (interaction.targetId === 'bucket-list') pushUpdates({ noteState });
//           else pushUpdates({ stickers });
//       }
//       isInteractingRef.current = false; 
//       setInteraction(prev => ({ ...prev, mode: 'IDLE', targetId: null }));
//       setIsOverTrash(false);
//   }, [interaction, isOverTrash, stickers, noteState, pushUpdates]);

//   useEffect(() => {
//       window.addEventListener('mousemove', handleGlobalMove);
//       window.addEventListener('mouseup', handleGlobalEnd);
//       window.addEventListener('touchmove', handleGlobalMove, { passive: false });
//       window.addEventListener('touchend', handleGlobalEnd);
//       return () => {
//           window.removeEventListener('mousemove', handleGlobalMove);
//           window.removeEventListener('mouseup', handleGlobalEnd);
//           window.removeEventListener('touchmove', handleGlobalMove);
//           window.removeEventListener('touchend', handleGlobalEnd);
//       };
//   }, [handleGlobalMove, handleGlobalEnd]);

//   return (
//     <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 relative overflow-x-hidden bg-grid-pattern pb-40">
        
//         {timeLeft.isAnniversary && <Confetti />}

//         {/* --- QUIRKY TOOLBAR --- */}
//         <div className="fixed top-4 right-4 z-[90] flex flex-row gap-2 sm:gap-3 flex-wrap justify-end">
//              {/* Sticker Button */}
//              <button onClick={() => setIsStickerMenuOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-yellow-400 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
//                 <Sparkles size={24} strokeWidth={2.5} className="text-slate-900" />
//              </button>

//              {/* Share Button */}
//              <button onClick={() => setIsShareOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
//                 <Share2 size={24} strokeWidth={2.5} className="text-slate-900" />
//              </button>

//              {/* People Button */}
//              <button onClick={() => setIsPeopleOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
//                 <Users size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-blue-500" />
//              </button>

//              {/* Chat Button */}
//              <button onClick={() => setIsChatOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
//                 <MessageCircle size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-green-500" />
//                 {hasUnreadMsg && <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
//              </button>

//              {/* Eraser Button */}
//              <button onClick={handleClearPage} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
//                 <Eraser size={24} strokeWidth={2.5} className="text-rose-600" />
//              </button>

//              {/* Exit Button */}
//              <button onClick={onExit} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] flex items-center justify-center hover:scale-105 active:translate-y-1 transition-all">
//                 <LogOut size={24} strokeWidth={2.5} className="text-yellow-400" />
//              </button>
//         </div>

//         <StickerMenu 
//             isOpen={isStickerMenuOpen}
//             onClose={() => setIsStickerMenuOpen(false)}
//             stickerLibrary={[...AVAILABLE_STICKERS, ...customLibrary]} 
//             onAddStickerToCanvas={(src) => {
//                 const newS = { id: `s-${Date.now()}`, type: 'image' as const, src, x: window.innerWidth/2 - 50, y: window.scrollY + 300, rotation: (Math.random()*20)-10, scale: 1 };
//                 setStickers([...stickers, newS]);
//                 pushUpdates({ stickers: [...stickers, newS] });
//             }}
//             onUploadStickerToLibrary={(src) => {
//                 const newLib = [...customLibrary, {id:`c-${Date.now()}`, src, label:'Custom'}];
//                 setCustomLibrary(newLib);
//                 pushUpdates({ customLibrary: newLib });
//             }}
//             onDeleteStickerFromLibrary={handleDeleteLibraryItem}
//         />
        
//         <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomId={room.roomId} pin={room.pin} />

//         <TrashBin isVisible={interaction.mode === 'DRAG' && interaction.targetId !== 'bucket-list'} isHovered={isOverTrash} />
//         <TodoModal isOpen={isTodoModalOpen} onClose={()=>setIsTodoModalOpen(false)} items={todoItems} setItems={updateTodoItems} />

//         {/* --- HERO SECTION --- */}
//         <div className="flex flex-col items-center gap-6 z-10 mt-24 sm:mt-16 mb-10 w-full max-w-4xl">
//              <div className="relative transform -rotate-2 mb-2">
//                  <div className="bg-sky-200 border-4 border-slate-900 px-4 py-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-lg">
//                     <span className="font-hand font-bold text-slate-900 text-sm uppercase tracking-wider">
//                        Target: {formatDateDisplay(room.targetISO || room.targetDate)}
//                     </span>
//                  </div>
//              </div>

//             <h1 className="text-5xl sm:text-7xl font-marker text-slate-800 mb-2 leading-tight text-center drop-shadow-sm">
//                 Counting down to Us
//             </h1>
//             <CountdownTimer timeLeft={timeLeft} />
//         </div>

//         <TapedPhoto imageSrc={photoData} onImageUpload={updatePhoto} />

//         <div className="mt-8 mb-20 text-center z-30 opacity-90 max-w-lg px-6 relative transform -rotate-1">
//              <div className="relative inline-block p-4">
//                  <div className="absolute inset-0 bg-green-200/40 rounded-lg -rotate-1 scale-110 -z-10 blur-[1px]"></div>
//                  <p className="font-marker text-2xl sm:text-4xl text-slate-800 leading-tight">
//                     "Every second that ticks by is just one second closer to making more memories with you."
//                  </p>
//              </div>
//              <div className="flex items-center justify-center gap-2 mt-4 text-rose-500">
//                 <span className="font-marker text-xl">Love always</span>
//                 <Heart size={20} fill="currentColor" className="animate-pulse" />
//              </div>
//         </div>

//         <div className="z-10 relative w-full flex justify-center mb-16 h-[300px]">
//             <StickyNote 
//                 data={noteState} 
//                 onMouseDown={(e)=>handleInteractionStart(e,'bucket-list','DRAG')} 
//                 onResizeStart={(e)=>handleInteractionStart(e,'bucket-list','RESIZE')} 
//                 onRotateStart={(e)=>handleInteractionStart(e,'bucket-list','ROTATE')} 
//                 onClick={()=>setIsTodoModalOpen(true)}
//             >
//                 <div className="flex flex-col h-full">
//                     <span className="font-bold text-2xl mb-4 text-rose-500 border-b-2 border-rose-100/50 pb-1">Bucket List</span>
//                     {todoItems.length === 0 ? (
//                         <p className="text-slate-400 text-lg italic mt-4 text-center">Tap edit to add dreams...</p>
//                     ) : (
//                         <ul className="space-y-1">
//                             {todoItems.map((item,k) => (
//                                 <li key={k} className="break-words leading-tight">• {item}</li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>
//             </StickyNote>
//         </div>

//         {/* STICKERS */}
//         {stickers.map(s => (
//             <DraggableSticker 
//                 key={s.id} 
//                 data={s} 
//                 onMouseDown={(e)=>handleInteractionStart(e,s.id,'DRAG')} 
//                 onResizeStart={(e)=>handleInteractionStart(e,s.id,'RESIZE')} 
//                 onRotateStart={(e)=>handleInteractionStart(e,s.id,'ROTATE')} 
//             />
//         ))}

//         <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={handleSendMessage} currentUser={currentUser} />
//         <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

//     </div>
//   );
// };

// export default CountdownRoom;







import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Users, LogOut, Eraser, Share2, Sparkles } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, isAnniversary: false });
  
  // Synced Data
  const [stickers, setStickers] = useState<StickerData[]>(room.stickers || []);
  const [todoItems, setTodoItems] = useState<string[]>(room.todoItems || []);
  const [noteState, setNoteState] = useState<NoteData>(room.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
  const [photoData, setPhotoData] = useState<string>(room.photo || 'us.png');
  const [customLibrary, setCustomLibrary] = useState<StickerDefinition[]>(room.customLibrary || []);
  const [chatMessages, setChatMessages] = useState<any[]>(room.chatMessages || []);
  const [members, setMembers] = useState<string[]>(room.members || []);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStickerMenuOpen, setIsStickerMenuOpen] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  
  // Interaction Engine State
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'IDLE', targetId: null, startMouse: {x:0,y:0}, initialData: {x:0,y:0,scale:1,rotation:0}
  });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Refs
  const isInteractingRef = useRef(false);
  const isSyncingRef = useRef(false);
  const lastChatLenRef = useRef(room.chatMessages?.length || 0);

  // --- NOTIFICATIONS & PERMISSIONS ---
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, []);

  const triggerNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/clock.png' });
    }
  };

  // --- SYNC ENGINE ---
  const syncRoom = async () => {
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
            if (!isInteractingRef.current) {
                setStickers(data.stickers || []);
                setTodoItems(data.todoItems || []);
                setNoteState(data.noteState || { x: 0, y: 0, rotation: -2, scale: 1 });
                setPhotoData(data.photo || 'us.png');
                setCustomLibrary(data.customLibrary || []);
                setMembers(data.members || []);
                
                // Chat Handling
                const newMsgs = data.chatMessages || [];
                if (newMsgs.length > lastChatLenRef.current) {
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    setChatMessages(newMsgs);
                    // Only notify if it's NOT my message
                    if (lastMsg.user !== currentUser) {
                        setHasUnreadMsg(true);
                        triggerNotification("New Message!", `${lastMsg.user}: ${lastMsg.text}`);
                    }
                    lastChatLenRef.current = newMsgs.length;
                }
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
    const target = room.targetISO || new Date(room.targetDate.year, room.targetDate.month, room.targetDate.day).toISOString();
    
    const tick = () => {
        const left = calculateTimeLeft(target);
        setTimeLeft(left);

        // --- SCHEDULED NOTIFICATIONS ---
        // 1 Day Remaining check
        if (left.days === 1 && left.hours === 0 && left.minutes === 0 && left.seconds === 0) {
            triggerNotification("1 Day Left!", "Get ready for the big moment!");
        }
        // 1 Minute Remaining check
        if (left.days === 0 && left.hours === 0 && left.minutes === 1 && left.seconds === 0) {
            triggerNotification("1 Minute Left!", "Almost there!");
        }
    };
    
    tick();
    const timer = setInterval(tick, 1000);
    const poller = setInterval(syncRoom, 1000); 
    return () => { clearInterval(timer); clearInterval(poller); };
  }, [room]);

  useEffect(() => {
    if (isChatOpen) setHasUnreadMsg(false);
  }, [isChatOpen]);

  const updateTodoItems = (items: string[]) => {
      setTodoItems(items);
      pushUpdates({ todoItems: items });
      triggerNotification("Bucket List Updated", `${currentUser} updated the list!`);
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
    lastChatLenRef.current = newMsgs.length;
    pushUpdates({ chatMessages: newMsgs });
  };

  const handleDeleteLibraryItem = (id: string) => {
      const newLib = customLibrary.filter(s => s.id !== id);
      setCustomLibrary(newLib);
      pushUpdates({ customLibrary: newLib });
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

        {/* --- QUIRKY TOOLBAR --- */}
        <div className="fixed top-4 right-4 z-[90] flex flex-row gap-2 sm:gap-3 flex-wrap justify-end">
             {/* Sticker Button */}
             <button onClick={() => setIsStickerMenuOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-yellow-400 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Sparkles size={24} strokeWidth={2.5} className="text-slate-900" />
             </button>

             {/* Share Button */}
             <button onClick={() => setIsShareOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Share2 size={24} strokeWidth={2.5} className="text-slate-900" />
             </button>

             {/* People Button */}
             <button onClick={() => setIsPeopleOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Users size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-blue-500" />
             </button>

             {/* Chat Button */}
             <button onClick={() => setIsChatOpen(true)} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <MessageCircle size={24} strokeWidth={2.5} className="text-slate-900 group-hover:text-green-500" />
                {hasUnreadMsg && <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>}
             </button>

             {/* Eraser Button */}
             <button onClick={handleClearPage} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <Eraser size={24} strokeWidth={2.5} className="text-rose-600" />
             </button>

             {/* Exit Button */}
             <button onClick={onExit} className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] flex items-center justify-center hover:scale-105 active:translate-y-1 transition-all">
                <LogOut size={24} strokeWidth={2.5} className="text-yellow-400" />
             </button>
        </div>

        <StickerMenu 
            isOpen={isStickerMenuOpen}
            onClose={() => setIsStickerMenuOpen(false)}
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
        
        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomId={room.roomId} pin={room.pin} />

        <TrashBin isVisible={interaction.mode === 'DRAG' && interaction.targetId !== 'bucket-list'} isHovered={isOverTrash} />
        <TodoModal isOpen={isTodoModalOpen} onClose={()=>setIsTodoModalOpen(false)} items={todoItems} setItems={updateTodoItems} />

        {/* --- HERO SECTION --- */}
        <div className="flex flex-col items-center gap-6 z-10 mt-24 sm:mt-16 mb-10 w-full max-w-4xl">
             <div className="relative transform -rotate-2 mb-2">
                 <div className="bg-sky-200 border-4 border-slate-900 px-4 py-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-lg">
                    <span className="font-hand font-bold text-slate-900 text-sm uppercase tracking-wider">
                       Target: {formatDateDisplay(room.targetISO || room.targetDate)}
                    </span>
                 </div>
             </div>

            <h1 className="text-5xl sm:text-7xl font-marker text-slate-800 mb-2 leading-tight text-center drop-shadow-sm">
                Counting down to Us
            </h1>
            <CountdownTimer timeLeft={timeLeft} />
        </div>

        <TapedPhoto imageSrc={photoData} onImageUpload={updatePhoto} />

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

        <div className="z-10 relative w-full flex justify-center mb-16 h-[300px]">
            <StickyNote 
                data={noteState} 
                onMouseDown={(e)=>handleInteractionStart(e,'bucket-list','DRAG')} 
                onResizeStart={(e)=>handleInteractionStart(e,'bucket-list','RESIZE')} 
                onRotateStart={(e)=>handleInteractionStart(e,'bucket-list','ROTATE')} 
                onClick={()=>setIsTodoModalOpen(true)}
            >
                <div className="flex flex-col h-full">
                    <span className="font-bold text-2xl mb-4 text-rose-500 border-b-2 border-rose-100/50 pb-1">Bucket List</span>
                    {todoItems.length === 0 ? (
                        <p className="text-slate-400 text-lg italic mt-4 text-center">Tap edit to add dreams...</p>
                    ) : (
                        <ul className="space-y-1">
                            {todoItems.map((item,k) => (
                                <li key={k} className="break-words leading-tight">• {item}</li>
                            ))}
                        </ul>
                    )}
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

        <ChatDrawer isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} onSend={handleSendMessage} currentUser={currentUser} />
        <PeopleList isOpen={isPeopleOpen} onClose={()=>setIsPeopleOpen(false)} members={members} />

    </div>
  );
};

export default CountdownRoom;
