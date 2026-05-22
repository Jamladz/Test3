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
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    if (user) {
      const loadGame = async () => {
        await fetchUser(user.id.toString(), user.username, user.first_name, user.start_param);
        setTimeout(() => {
            setIsLoading(false);
        }, 1500); // give the loading bar a moment
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
      <div 
        className="flex flex-col min-h-screen bg-[#050505] text-white relative overflow-hidden"
        style={{
          backgroundImage: 'url("https://i.suar.me/xz5YG/l")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        
        <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center px-8 z-10">
          <div className="flex items-center gap-1 mb-4 text-[#a25aff] font-mono text-sm tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_8px_rgba(162,90,255,0.8)]">
            <span className="animate-pulse">L</span>
            <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>O</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>A</span>
            <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>D</span>
            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>I</span>
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>N</span>
            <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>G</span>
            <span className="animate-pulse" style={{ animationDelay: '0.7s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.8s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.9s' }}>.</span>
          </div>
          
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-[#6b21a8] to-[#c026d3] shadow-[0_0_15px_rgba(192,38,211,0.6)] transition-all duration-300 ease-out"
              style={{ width: `${Math.min(loadingProgress, 100)}%` }}
            ></div>
          </div>
        </div>
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
