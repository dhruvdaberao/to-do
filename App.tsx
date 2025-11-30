
import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import CountdownRoom from './components/CountdownRoom';

// API URL CONFIGURATION
const API_URL = (import.meta as any).env?.VITE_API_URL || "/api/data";

const App: React.FC = () => {
  // Screen Routing State
  const [screen, setScreen] = useState<'AUTH' | 'DASHBOARD' | 'ROOM'>('AUTH');
  
  // User Session
  const [user, setUser] = useState<{ username: string } | null>(null);
  
  // Active Room Data
  const [activeRoom, setActiveRoom] = useState<any>(null);

  useEffect(() => {
    // Check for cached session
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
        setScreen('DASHBOARD');
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

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('app_user');
      setScreen('AUTH');
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

  return <div className="p-10 text-center">Loading...</div>;
};

export default App;
