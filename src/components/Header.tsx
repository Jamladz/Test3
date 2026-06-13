import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';
import { Settings, Coins, Bell } from 'lucide-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { GameService } from '../services/api';
import { ProfileModal } from './ProfileModal';
import { motion, AnimatePresence } from 'motion/react';

export function Header() {
  const { profitPerHour, username, firebaseUid, balance } = useGameStore();
  const wallet = useTonWallet();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

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
    <div className="flex flex-col gap-2 p-3 pt-1 mb-0 z-40 relative shrink-0">
      <div className="flex justify-between items-center w-full">
        
        <button onClick={() => setShowProfile(true)} className="group flex items-center gap-3 bg-white/5 border border-white/10 p-2 pl-2 pr-5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left active:scale-95 shadow-lg relative overflow-hidden w-full max-w-[220px]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FFD700] to-[#E6C200] p-[2px] shadow-[0_0_15px_rgba(255,215,0,0.3)] shrink-0 select-none">
            <div className="w-full h-full rounded-[10px] bg-[#1c1c1e] flex items-center justify-center overflow-hidden border border-black/50">
              <img src="https://i.suar.me/X9N3J/l" alt="PlushTap" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-bold text-[13px] sm:text-[14px] tracking-wide text-white truncate group-hover:text-[#00f3ff] transition-colors flex items-center gap-1.5">
               <span className="truncate">{username || 'Player1'}</span>
               <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]"></span>
            </h2>
            <div className="flex items-center gap-1 mt-0.5 shrink-0">
               <span className="text-[10px] sm:text-[11px] font-bold text-[#FFD700] uppercase tracking-wider truncate">{currentLevel.name}</span>
               <span className="text-[9px] sm:text-[10px] font-bold text-white/40 shrink-0 whitespace-nowrap">Lvl {currentLevelIdx + 1}</span>
            </div>
          </div>
        </button>

        <div className="flex justify-end gap-2 items-center scale-[0.85] origin-right ml-auto relative">
          <div className="relative">
            <button 
              onClick={() => setShowNotification(!showNotification)}
              className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-2 hover:bg-white/20 transition-colors"
            >
               <Bell size={20} className="text-white" />
               {balance >= 10000000 && (
                 <span className="absolute -top-1 -right-1 flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                 </span>
               )}
            </button>
            
            <AnimatePresence>
              {showNotification && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute top-12 right-0 bg-[#2c2c2e] border border-red-500/30 shadow-2xl rounded-2xl w-64 p-4 z-[100] origin-top-right flex flex-col gap-2"
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold text-sm tracking-wide">Notifications</span>
                      {balance >= 10000000 && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>}
                   </div>
                   
                   {balance >= 10000000 ? (
                     <button 
                       onClick={() => {
                          const event = new Event('openAirdrop');
                          window.dispatchEvent(event);
                          setShowNotification(false);
                       }}
                       className="bg-[#1c1c1e] hover:bg-[#3c3c3e] transition-colors border border-white/5 rounded-xl p-3 text-left w-full shadow-inner group"
                     >
                        <h4 className="text-red-400 font-bold text-sm mb-1 group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] transition-all">Withdrawal Available</h4>
                        <p className="text-white/70 text-xs leading-relaxed">
                          You can withdraw your <strong className="text-white">Plush Token</strong> now! Click here to open the withdrawal page.
                        </p>
                     </button>
                   ) : (
                     <div className="bg-[#1c1c1e] border border-white/5 rounded-xl p-3 text-center w-full shadow-inner">
                        <p className="text-white/50 text-xs py-2">
                           No new notifications. Reach 10M coins to unlock withdrawals!
                        </p>
                     </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
