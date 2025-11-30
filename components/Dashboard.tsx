// import React, { useState } from 'react';
// import { Plus, LogIn, LogOut } from 'lucide-react';

// interface DashboardProps {
//   username: string;
//   onJoinRoom: (roomData: any) => void;
//   apiUrl: string;
// }

// const Dashboard: React.FC<DashboardProps> = ({ username, onJoinRoom, apiUrl }) => {
//   const [mode, setMode] = useState<'MENU' | 'CREATE' | 'JOIN'>('MENU');
  
//   const [newRoomId, setNewRoomId] = useState('');
//   const [newPin, setNewPin] = useState('');
//   const [date, setDate] = useState('');
//   const [time, setTime] = useState('00:00');
  
//   const [joinRoomId, setJoinRoomId] = useState('');
//   const [joinPin, setJoinPin] = useState('');

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleFetch = async (payload: any) => {
//       setLoading(true);
//       setError('');
//       try {
//         const res = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
        
//         if (!res.ok) {
//             const text = await res.text();
//             throw new Error(text.includes('error') ? JSON.parse(text).error : `Error ${res.status}`);
//         }
        
//         const data = await res.json();
//         if (data.success) {
//             onJoinRoom(data.room);
//         } else {
//             setError(data.error);
//         }
//       } catch (e: any) {
//         setError(e.message || 'Connection Failed');
//       } finally {
//         setLoading(false);
//       }
//   };

//   const handleCreate = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Combine Date and Time into ISO string
//     const combined = new Date(`${date}T${time}`);
//     const targetISO = combined.toISOString();

//     handleFetch({
//         action: 'CREATE_ROOM',
//         payload: { roomId: newRoomId, pin: newPin, targetISO, creatorId: username }
//     });
//   };

//   const handleJoin = (e: React.FormEvent) => {
//     e.preventDefault();
//     handleFetch({
//         action: 'JOIN_ROOM',
//         payload: { roomId: joinRoomId, pin: joinPin, username }
//     });
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('app_user');
//     window.location.reload();
//   };

//   return (
//     <div className="min-h-screen bg-grid-pattern flex flex-col items-center justify-center p-4">
      
//       <div className="mb-8 text-center">
//         <h1 className="font-marker text-5xl text-slate-900 mb-2">Hello, {username}!</h1>
//         <p className="font-hand text-xl text-slate-500 font-bold">Ready to make some memories?</p>
//       </div>

//       <div className="w-full max-w-md bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-xl overflow-hidden p-8 flex flex-col gap-6 transform -rotate-1 transition-all">
        
//         {mode === 'MENU' && (
//             <>
//                 <button 
//                     onClick={() => setMode('CREATE')}
//                     className="group bg-yellow-400 text-slate-900 p-6 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between"
//                 >
//                     <div className="text-left">
//                         <h3 className="font-marker text-2xl font-bold">Create Countdown</h3>
//                         <p className="font-hand text-sm font-bold opacity-80">Start a new room with a PIN</p>
//                     </div>
//                     <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
//                 </button>

//                 <button 
//                     onClick={() => setMode('JOIN')}
//                     className="group bg-sky-200 text-slate-900 p-6 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between"
//                 >
//                     <div className="text-left">
//                         <h3 className="font-marker text-2xl font-bold">Join Countdown</h3>
//                         <p className="font-hand text-sm font-bold opacity-80">Enter Room ID & PIN</p>
//                     </div>
//                     <LogIn size={32} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
//                 </button>

//                 <button 
//                     onClick={handleLogout}
//                     className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 font-bold font-hand transition-colors"
//                 >
//                     <LogOut size={16} /> Logout
//                 </button>
//             </>
//         )}

//         {mode === 'CREATE' && (
//             <form onSubmit={handleCreate} className="flex flex-col gap-4">
//                 <h3 className="font-marker text-2xl text-center mb-2">Create New Room</h3>
//                 {error && <p className="bg-rose-100 text-rose-600 p-2 rounded-lg text-center font-bold text-sm border border-rose-200">{error}</p>}
                
//                 <input 
//                     type="text" placeholder="Room Name (ID)" value={newRoomId} onChange={e => setNewRoomId(e.target.value)}
//                     className="border-2 border-slate-200 p-3 rounded-lg font-bold" required
//                 />
//                 <div className="flex gap-2">
//                     <input 
//                         type="text" placeholder="4-Digit PIN" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)}
//                         className="border-2 border-slate-200 p-3 rounded-lg font-bold w-full" required
//                     />
//                 </div>
//                 <div className="flex gap-2">
//                     <input 
//                         type="date" value={date} onChange={e => setDate(e.target.value)}
//                         className="border-2 border-slate-200 p-3 rounded-lg font-bold w-1/2" required
//                     />
//                     <input 
//                         type="time" value={time} onChange={e => setTime(e.target.value)}
//                         className="border-2 border-slate-200 p-3 rounded-lg font-bold w-1/2" required
//                     />
//                 </div>

//                 <div className="flex gap-3 mt-4">
//                     <button type="button" onClick={() => setMode('MENU')} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Back</button>
//                     <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg shadow-[4px_4px_0px_0px_#fbbf24] hover:translate-y-0.5 active:shadow-none transition-all">
//                         {loading ? '...' : 'Create!'}
//                     </button>
//                 </div>
//             </form>
//         )}

//         {mode === 'JOIN' && (
//             <form onSubmit={handleJoin} className="flex flex-col gap-4">
//                 <h3 className="font-marker text-2xl text-center mb-2">Join Room</h3>
//                 {error && <p className="bg-rose-100 text-rose-600 p-2 rounded-lg text-center font-bold text-sm border border-rose-200">{error}</p>}
                
//                 <input 
//                     type="text" placeholder="Room Name (ID)" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)}
//                     className="border-2 border-slate-200 p-3 rounded-lg font-bold" required
//                 />
//                 <input 
//                     type="password" placeholder="4-Digit PIN" maxLength={4} value={joinPin} onChange={e => setJoinPin(e.target.value)}
//                     className="border-2 border-slate-200 p-3 rounded-lg font-bold tracking-widest text-center text-xl" required
//                 />

//                 <div className="flex gap-3 mt-4">
//                     <button type="button" onClick={() => setMode('MENU')} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Back</button>
//                     <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg shadow-[4px_4px_0px_0px_#fbbf24] hover:translate-y-0.5 active:shadow-none transition-all">
//                         {loading ? '...' : 'Enter!'}
//                     </button>
//                 </div>
//             </form>
//         )}

//       </div>
//     </div>
//   );
// };

// export default Dashboard;





import React, { useState, useEffect } from 'react';
import { Plus, LogIn, LogOut, ArrowRight, Calendar } from 'lucide-react';

interface DashboardProps {
  username: string;
  onJoinRoom: (roomData: any) => void;
  apiUrl: string;
}

const Dashboard: React.FC<DashboardProps> = ({ username, onJoinRoom, apiUrl }) => {
  const [mode, setMode] = useState<'MENU' | 'CREATE' | 'JOIN'>('MENU');
  
  const [newRoomId, setNewRoomId] = useState('');
  const [newPin, setNewPin] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('00:00');
  
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPin, setJoinPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userRooms, setUserRooms] = useState<any[]>([]);

  // Fetch user's rooms on mount
  useEffect(() => {
      const fetchUserRooms = async () => {
          try {
              const res = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'GET_USER_ROOMS', payload: { username } })
              });
              const data = await res.json();
              if (data.success) {
                  setUserRooms(data.rooms);
              }
          } catch (e) { console.error("Failed to fetch rooms"); }
      };
      if (mode === 'MENU') {
          fetchUserRooms();
      }
  }, [apiUrl, username, mode]);

  const handleFetch = async (payload: any) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text.includes('error') ? JSON.parse(text).error : `Error ${res.status}`);
        }
        
        const data = await res.json();
        if (data.success) {
            onJoinRoom(data.room);
        } else {
            setError(data.error);
        }
      } catch (e: any) {
        setError(e.message || 'Connection Failed');
      } finally {
        setLoading(false);
      }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const combined = new Date(`${date}T${time}`);
    const targetISO = combined.toISOString();

    handleFetch({
        action: 'CREATE_ROOM',
        payload: { roomId: newRoomId, pin: newPin, targetISO, creatorId: username }
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetch({
        action: 'JOIN_ROOM',
        payload: { roomId: joinRoomId, pin: joinPin, username }
    });
  };

  const handleDirectJoin = (roomId: string) => {
      // Direct fetch logic bypassing PIN entry since we are already a member
      setLoading(true);
      fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_ROOM', payload: { roomId } })
      })
      .then(res => res.json())
      .then(data => {
          if(data.roomId) onJoinRoom(data);
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col items-center justify-center p-4">
      
      <div className="mb-8 text-center">
        <h1 className="font-marker text-5xl text-slate-900 mb-2">Hello, {username}!</h1>
        <p className="font-hand text-xl text-slate-500 font-bold">Ready to make some memories?</p>
      </div>

      <div className="w-full max-w-md bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-xl overflow-hidden p-8 flex flex-col gap-6 transform -rotate-1 transition-all">
        
        {mode === 'MENU' && (
            <>
                <button 
                    onClick={() => setMode('CREATE')}
                    className="group bg-yellow-400 text-slate-900 p-6 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between"
                >
                    <div className="text-left">
                        <h3 className="font-marker text-2xl font-bold">Create Countdown</h3>
                        <p className="font-hand text-sm font-bold opacity-80">Start a new room with a PIN</p>
                    </div>
                    <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                </button>

                <button 
                    onClick={() => setMode('JOIN')}
                    className="group bg-sky-200 text-slate-900 p-6 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between"
                >
                    <div className="text-left">
                        <h3 className="font-marker text-2xl font-bold">Join Countdown</h3>
                        <p className="font-hand text-sm font-bold opacity-80">Enter Room ID & PIN</p>
                    </div>
                    <LogIn size={32} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* --- YOUR COUNTDOWNS SECTION --- */}
                {userRooms.length > 0 && (
                    <div className="mt-2">
                        <h3 className="font-marker text-xl text-slate-400 mb-3 text-center border-b-2 border-slate-100 pb-2">Your Countdowns</h3>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            {userRooms.map((room) => (
                                <button 
                                    key={room._id}
                                    onClick={() => handleDirectJoin(room.roomId)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-900 p-3 rounded-lg flex items-center justify-between group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                                            <Calendar size={18} className="text-slate-500" />
                                        </div>
                                        <span className="font-hand font-bold text-lg text-slate-800">{room.roomId}</span>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleLogout}
                    className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 font-bold font-hand transition-colors"
                >
                    <LogOut size={16} /> Logout
                </button>
            </>
        )}

        {mode === 'CREATE' && (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <h3 className="font-marker text-2xl text-center mb-2">Create New Room</h3>
                {error && <p className="bg-rose-100 text-rose-600 p-2 rounded-lg text-center font-bold text-sm border border-rose-200">{error}</p>}
                
                <input 
                    type="text" placeholder="Room Name (ID)" value={newRoomId} onChange={e => setNewRoomId(e.target.value)}
                    className="border-2 border-slate-200 p-3 rounded-lg font-bold" required
                />
                <div className="flex gap-2">
                    <input 
                        type="text" placeholder="4-Digit PIN" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)}
                        className="border-2 border-slate-200 p-3 rounded-lg font-bold w-full" required
                    />
                </div>
                <div className="flex gap-2">
                    <input 
                        type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="border-2 border-slate-200 p-3 rounded-lg font-bold w-1/2" required
                    />
                    <input 
                        type="time" value={time} onChange={e => setTime(e.target.value)}
                        className="border-2 border-slate-200 p-3 rounded-lg font-bold w-1/2" required
                    />
                </div>

                <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setMode('MENU')} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Back</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg shadow-[4px_4px_0px_0px_#fbbf24] hover:translate-y-0.5 active:shadow-none transition-all">
                        {loading ? '...' : 'Create!'}
                    </button>
                </div>
            </form>
        )}

        {mode === 'JOIN' && (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <h3 className="font-marker text-2xl text-center mb-2">Join Room</h3>
                {error && <p className="bg-rose-100 text-rose-600 p-2 rounded-lg text-center font-bold text-sm border border-rose-200">{error}</p>}
                
                <input 
                    type="text" placeholder="Room Name (ID)" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)}
                    className="border-2 border-slate-200 p-3 rounded-lg font-bold" required
                />
                <input 
                    type="password" placeholder="4-Digit PIN" maxLength={4} value={joinPin} onChange={e => setJoinPin(e.target.value)}
                    className="border-2 border-slate-200 p-3 rounded-lg font-bold tracking-widest text-center text-xl" required
                />

                <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setMode('MENU')} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Back</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg shadow-[4px_4px_0px_0px_#fbbf24] hover:translate-y-0.5 active:shadow-none transition-all">
                        {loading ? '...' : 'Enter!'}
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
