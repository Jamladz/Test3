import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';
import { Settings, Coins } from 'lucide-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { GameService } from '../services/api';
import { ProfileModal } from './ProfileModal';
import { AnimatePresence } from 'motion/react';

export function Header() {
  const { profitPerHour, username, firebaseUid, balance } = useGameStore();
  const wallet = useTonWallet();
  const [showProfile, setShowProfile] = useState(false);

  const LEVELS = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 25000 },
    { name: 'Gold', min: 100000 },
    { name: 'Platinum', min: 500000 },
    { name: 'Diamond', min: 2000000 },
    { name: 'Epic', min: 10000000 },
    { name: 'Legendary', min: 50000000 },
    { name: 'Master', min: 100000000 },
    { name: 'GrandMaster', min: 1000000000 },
    { name: 'Lord', min: 5000000000 },
  ];

  let currentLevelIdx = LEVELS.findIndex(l => balance < l.min) - 1;
  if (currentLevelIdx === -2) currentLevelIdx = LEVELS.length - 1;
  if (currentLevelIdx < 0) currentLevelIdx = 0;
  
  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel = LEVELS[currentLevelIdx + 1];
  
  const progressToNext = nextLevel 
    ? Math.min(100, Math.max(0, ((balance - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;

  useEffect(() => {
    if (wallet && firebaseUid) {
      GameService.updateWallet(firebaseUid, wallet.account.address).catch(console.error);
    }
  }, [wallet, firebaseUid]);

  return (
    <>
    <div className="flex flex-col gap-2 p-3 pt-1 mb-0 z-10 relative shrink-0">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#FFD700] to-[#E6C200] p-0.5 shadow-[0_4px_10px_rgba(255,215,0,0.3)] shrink-0">
            <div className="w-full h-full rounded-[6px] bg-[#1c1c1e] flex items-center justify-center overflow-hidden">
              <img src="https://i.suar.me/X9N3J/l" alt="PlushTap" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col min-w-[80px]">
            <h2 onClick={() => setShowProfile(true)} className="font-bold text-xs tracking-wide text-white truncate cursor-pointer hover:text-[#00f3ff] transition-colors">{username || 'Player1'}</h2>
            {/* Level progress bar */}
            <div className="flex items-center justify-between mt-1 gap-2">
               <span className="text-[10px] font-bold text-gray-400 capitalize">{currentLevel.name}</span>
               <span className="text-[10px] font-bold text-gray-500">{currentLevelIdx + 1}/{LEVELS.length}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1c1c1e] rounded-full overflow-hidden mt-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#9d00ff] to-[#00f3ff] transition-all duration-300" 
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 items-center scale-[0.85] origin-right ml-auto">
          <TonConnectButton />
        </div>
      </div>
      
      <div className="flex w-full">
        <div className="flex bg-[#1c1c1e] rounded-[10px] border border-white/5 p-2 px-3 w-full justify-center">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Profit per hour</span>
            <div className="flex items-center gap-1.5 font-mono">
              <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-3.5 h-3.5 object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
              <span className="text-sm font-bold text-white tracking-tight">+{formatCurrency(profitPerHour)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <AnimatePresence>
       {showProfile && (
           <ProfileModal onClose={() => setShowProfile(false)} />
       )}
    </AnimatePresence>
    </>
  );
}
