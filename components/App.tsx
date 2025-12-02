
import React, { useState, useEffect } from 'react';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import CountdownRoom from './CountdownRoom';

// API URL CONFIGURATION
const API_URL = (import.meta as any).env?.VITE_API_URL || "/api/data";

const App: React.FC = () => {
  // Initialize User directly from storage for instant load
  const [user, setUser] = useState<{ username: string } | null>(() => {
      try {
          const saved = localStorage.getItem('app_user');
          return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
  });

  // Initialize Screen based on user existence
  const [screen, setScreen] = useState<'AUTH' | 'DASHBOARD' | 'ROOM'>(() => {
      return localStorage.getItem('app_user') ? 'DASHBOARD' : 'AUTH';
  });
  
  // Active Room Data
  const [activeRoom, setActiveRoom] = useState<any>(null);

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

  if (screen === 'AUTH') {
      return <AuthScreen onAuthenticate={handleAuthenticate} apiUrl={API_URL} />;
  }

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

  return <div className="p-10 text-center font-hand text-xl animate-pulse mt-20">Loading...</div>;
};

export default App;
