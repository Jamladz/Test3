import React, { useState, useEffect } from 'react';
import { useTelegramAutoLogin } from './hooks/useTelegram';
import { useGameStore } from './store/useGameStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Game } from './pages/Game';
import { Mine } from './pages/Mine';
import { Friends } from './pages/Friends';
import { Tasks } from './pages/Tasks';
import { Admin } from './pages/Admin';

export default function App() {
  const user = useTelegramAutoLogin();
  const { fetchUser, sync, role } = useGameStore();
  const [currentTab, setCurrentTab] = useState('game');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const loadGame = async () => {
        await fetchUser(user.id.toString(), user.username, user.first_name, user.start_param);
        setIsLoading(false);
      };
      loadGame();
    }
  }, [user, fetchUser]);

  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(() => {
        sync();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoading, sync]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="w-24 h-24 rounded-full border-4 border-[#00f3ff] border-t-transparent animate-spin mb-4" />
        <h1 className="font-mono text-xl neon-text uppercase tracking-widest">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#000000] text-white w-full sm:max-w-md sm:mx-auto relative overflow-hidden shadow-2xl sm:border-x sm:border-white/5">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9d00ff]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00f3ff]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex-1 flex flex-col z-10 w-full relative min-h-0 pt-safe">
        <Header />
        
        {currentTab === 'game' && <Game />}
        {currentTab === 'mine' && <Mine />}
        {currentTab === 'tasks' && <Tasks />}
        {currentTab === 'friends' && <Friends />}
        {currentTab === 'admin' && role === 'admin' && <Admin />}

        <Navigation currentTab={currentTab} setTab={setCurrentTab} isAdmin={role === 'admin'} />
      </div>
    </div>
  );
}
