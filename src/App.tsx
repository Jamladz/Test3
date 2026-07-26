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
    function getReferralCode(): string | null {
      // 1. Telegram WebApp initDataUnsafe start_param
      const tgParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      if (tgParam) return tgParam.replace(/^ref_/, '');

      // 2. URL search params (e.g. tgWebAppStartParam, startapp, start_param, ref)
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const ref = searchParams.get('tgWebAppStartParam') || searchParams.get('startapp') || searchParams.get('start_param') || searchParams.get('ref');
        if (ref) return ref.replace(/^ref_/, '');
      } catch (e) {
        // ignore
      }

      // 3. URL hash search params
      try {
        if (window.location.hash) {
          const hashStr = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hashStr);
          const ref = hashParams.get('tgWebAppStartParam') || hashParams.get('startapp') || hashParams.get('start_param') || hashParams.get('ref');
          if (ref) return ref.replace(/^ref_/, '');
        }
      } catch (e) {
        // ignore
      }

      // 4. Stored pending referral code in localStorage
      try {
        const stored = localStorage.getItem('plush_pending_ref_code');
        if (stored) return stored;
      } catch (e) {
        // ignore
      }

      return null;
    }

    const refCode = getReferralCode();
    if (refCode) {
      try {
        localStorage.setItem('plush_pending_ref_code', refCode);
      } catch (e) {
        // ignore
      }
    }

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();

      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      initUser(tgUser, refCode);
    } else {
      initUser(undefined, refCode);
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
