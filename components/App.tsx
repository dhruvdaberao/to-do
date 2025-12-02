
import React, { useState, useEffect } from 'react';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import CountdownRoom from './CountdownRoom';

// API URL CONFIGURATION
const API_URL = (import.meta as any).env?.VITE_API_URL || "/api/data";

const App: React.FC = () => {
  // User Session State
  const [user, setUser] = useState<{ username: string } | null>(null);
  
  // Screen Routing State
  const [screen, setScreen] = useState<'AUTH' | 'DASHBOARD' | 'ROOM'>('AUTH');
  
  // Active Room Data
  const [activeRoom, setActiveRoom] = useState<any>(null);
  
  // Initial Load Check
  useEffect(() => {
    try {
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.username) {
                setUser(parsed);
                setScreen('DASHBOARD');
            } else {
                // Invalid data, clear it
                localStorage.removeItem('app_user');
                setScreen('AUTH');
            }
        } else {
            setScreen('AUTH');
        }
    } catch (e) {
        localStorage.removeItem('app_user');
        setScreen('AUTH');
    }
  }, []);

  const handleAuthenticate = (userData: { username: string }) => {
      setUser(userData);
      localStorage.setItem('app_user', JSON.stringify(userData));
      setScreen('DASHBOARD');
  };

  const handleJoinRoom = (roomData: any) => {
      setActiveRoom(roomData);
      setScreen('ROOM');
  };

  const handleExitRoom = () => {
      setActiveRoom(null);
      setScreen('DASHBOARD');
  };

  // --- RENDER ROUTER ---

  if (screen === 'DASHBOARD' && user) {
      return <Dashboard username={user.username} onJoinRoom={handleJoinRoom} apiUrl={API_URL} />;
  }

  if (screen === 'ROOM' && activeRoom && user) {
      return (
        <CountdownRoom 
            room={activeRoom} 
            currentUser={user.username} 
            apiUrl={API_URL} 
            onExit={handleExitRoom} 
        />
      );
  }

  if (screen === 'AUTH') {
      return <AuthScreen onAuthenticate={handleAuthenticate} apiUrl={API_URL} />;
  }

  // Fallback / Loading State (Visible)
  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <div className="p-10 text-center font-hand text-xl animate-pulse text-slate-500">
            Loading Application...
        </div>
    </div>
  );
};

export default App;
