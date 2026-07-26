import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Friends } from './pages/Friends';
import { Profile } from './pages/Profile';
import { Navigation } from './components/Navigation';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const { initUser } = useAppStore();

  useEffect(() => {
    // Detect Telegram WebApp user & start_param (referral code)
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();

      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      const startParam = window.Telegram.WebApp.initDataUnsafe?.start_param;
      const refCode = startParam ? startParam.replace('ref_', '') : null;

      initUser(tgUser, refCode);
    } else {
      initUser();
    }
  }, [initUser]);

  return (
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json">
      <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white relative select-none">
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
          {currentTab === 'home' && <Home />}
          {currentTab === 'tasks' && <Tasks />}
          {currentTab === 'friends' && <Friends />}
          {currentTab === 'profile' && <Profile />}
        </div>

        {/* Navigation Bar */}
        <Navigation currentTab={currentTab} setTab={setCurrentTab} />
      </div>
    </TonConnectUIProvider>
  );
}
