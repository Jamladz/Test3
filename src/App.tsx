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
import { ReferralSuccessModal } from './components/ReferralSuccessModal';
import { AdSequenceOverlay } from './components/AdSequenceOverlay';

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
        await fetchUser(user.id.toString(), user.username, user.first_name, user.start_param, user.initData);
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
        useGameStore.getState().syncGramMining();
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
        <div className="absolute inset-0 bg-black/20"></div>
        
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

  if (role === 'banned') {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#000000] text-white w-full sm:max-w-md sm:mx-auto relative overflow-hidden items-center justify-center px-6 text-center shadow-2xl sm:border-x sm:border-white/5">
        <div className="absolute inset-0 bg-red-900/5 z-0"></div>
        <div className="z-10 flex flex-col items-center w-full">
            <div className="w-24 h-24 bg-red-500/10 rounded-[28px] flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative">
              <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-full"></div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] relative z-10">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full mb-6 text-red-500 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
                Account Suspended
            </div>
            
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Access Prohibited</h1>
            
            <p className="text-white/60 text-sm mb-8 leading-relaxed px-2">
               Your account has been permanently suspended due to severe violations of our Terms of Service. Fraudulent activity degrades the experience for our fair community.
            </p>
            
            <div className="bg-[#111114] w-full border border-white/5 rounded-[24px] p-6 mb-8 shadow-inner relative overflow-hidden text-left">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
               <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold">Reason for Action</p>
               <p className="text-white/80 text-sm font-medium leading-relaxed">Systematic exploitation and fraudulent mechanics detected on this account.</p>
               
               <div className="mt-5 pt-5 border-t border-white/5 flex justify-between items-center bg-black/20 -mx-6 -mb-6 px-6 py-4">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Status</span>
                  <span className="text-red-400 text-[11px] font-bold tracking-widest uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">Permanent Ban</span>
               </div>
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
      
      <ReferralSuccessModal />
      <AdSequenceOverlay />
    </div>
  );
}
