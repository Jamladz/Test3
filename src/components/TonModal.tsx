import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Pickaxe, ActivitySquare, ArrowUpCircle, ChevronLeft, Loader2, Play, Users } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';
import { startAdSequence } from './AdSequenceOverlay';
import { useTonConnectUI } from '@tonconnect/ui-react';

interface TonModalProps {
  onClose: () => void;
}

export function TonModal({ onClose }: TonModalProps) {
  const { tonBalance, tonMiningRate, upgradeTonMiningViaAds, tonMiningActiveUntil, startTonMining, tonAdsWatchedDaily, lastTonAdReset, buyTonPackage } = useGameStore();
  const [tonConnectUI] = useTonConnectUI();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isMining, setIsMining] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(tonBalance);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activeMiners, setActiveMiners] = useState(25842);

  // Active miners random walk
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMiners(prev => {
        const change = Math.floor(Math.random() * 50) - 20;
        let next = prev + change;
        if (next < 25100) next += 100;
        if (next > 26900) next -= 100;
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (tonMiningActiveUntil > now) {
        setIsMining(true);
        const diff = tonMiningActiveUntil - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setIsMining(false);
        setTimeLeft('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tonMiningActiveUntil]);

  // Smooth balance ticker
  useEffect(() => {
    if (!isMining) {
      setDisplayBalance(tonBalance);
      return;
    }
    const ticker = setInterval(() => {
      const state = useGameStore.getState();
      const now = Date.now();
      const effectiveNow = Math.min(now, state.tonMiningActiveUntil);
      const diffDays = Math.max(0, (effectiveNow - Math.min(state.lastTonSync, state.tonMiningActiveUntil)) / (1000 * 60 * 60 * 24));
      setDisplayBalance(state.tonBalance + (state.tonMiningRate * diffDays));
    }, 50);
    return () => clearInterval(ticker);
  }, [isMining, tonBalance]);

  const isMiningActive = isMining;
  
  const now = Date.now();
  const isNewDay = new Date(now).getUTCDate() !== new Date(lastTonAdReset).getUTCDate();
  const currentAdsWatched = isNewDay ? 0 : tonAdsWatchedDaily;

  const handlePurchase = async (price: number, increase: number) => {
    if (isUpgrading) return;
    try {
      setIsUpgrading(true);
      if (!tonConnectUI.connected) {
        await tonConnectUI.connectWallet();
      }
      if (tonConnectUI.connected) {
        const amountNano = Math.floor(price * 1000000000).toString();
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 60,
          messages: [
            {
              address: "UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3",
              amount: amountNano,
            }
          ]
        };
        await tonConnectUI.sendTransaction(transaction);
        buyTonPackage(price, increase);
        const twa = (window as any).Telegram?.WebApp;
        if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
      }
    } catch (e: any) {
      console.error("TON purchase failed", e);
      const twa = (window as any).Telegram?.WebApp;
      const msg = e?.message || String(e);
      if (twa?.showAlert && (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline'))) {
          twa.showAlert("Transaction was cancelled.");
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#0d0d0f] flex flex-col items-center overflow-hidden h-[100dvh]"
    >
      {/* Header */}
      <div className="w-full shrink-0 flex justify-between items-center px-4 py-6 border-b border-white/5 bg-[#1c1c1e]/50 backdrop-blur-xl relative z-50">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
          <span className="font-bold text-lg tracking-wide uppercase">Exit</span>
        </button>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner">
          <img src="https://i.suar.me/MpXLm/l" alt="TON" className="w-5 h-5 object-contain drop-shadow-[0_0_5px_rgba(0,243,255,0.6)]" />
          <span className="font-bold text-white font-mono">{tonBalance.toFixed(4)} <span className="text-white/50 text-xs">TON</span></span>
        </div>
      </div>

      <div className="w-full max-w-md px-6 flex flex-col items-center flex-1 relative overflow-y-auto overflow-x-hidden min-h-0 py-8 scrollbar-hide">
        {isMiningActive && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] max-w-[600px] pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,243,255,0.1)_0%,_transparent_70%)] animate-pulse" />
          </div>
        )}

        {/* Big Animated Logo */}
        <div className="relative mb-6 shrink-0 mt-4">
          <div className={`w-32 h-32 md:w-36 md:h-36 relative z-10 transition-transform duration-1000 ${isMiningActive ? 'animate-[bounce_3s_infinite]' : ''}`}>
            {isMiningActive && (
               <div className="absolute inset-0 bg-[#00f3ff]/20 rounded-full blur-2xl animate-ping" />
            )}
            <img 
              src="https://i.suar.me/MpXLm/l" 
              alt="TON" 
              className={`w-full h-full object-contain ${isMiningActive ? 'drop-shadow-[0_0_25px_rgba(0,243,255,0.8)]' : 'drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] grayscale opacity-80'}`} 
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6 w-full shrink-0">
           <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
             <img src="https://i.suar.me/MpXLm/l" alt="TON" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
             TON Miner
           </h2>
           <div className="flex flex-col items-center justify-center gap-2 mt-3">
             <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${isMiningActive ? 'bg-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.8)] animate-pulse' : 'bg-red-500'}`} />
               <p className={`text-sm tracking-widest font-bold uppercase ${isMiningActive ? 'text-[#00f3ff]' : 'text-red-500'}`}>
                  {isMiningActive ? "Mining Array Active" : "Mining Array Offline"}
               </p>
             </div>
             <div className="flex items-center gap-1 mt-1 text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
               <Users size={14} className="text-[#00f3ff]" />
               <span className="text-xs font-mono">Active Miners: <span className="text-white font-bold">{activeMiners.toLocaleString()}</span></span>
             </div>
           </div>
        </div>

        {/* Current Mining Stats Card */}
        <div className="w-full bg-[#1c1c1e] border-2 border-white/5 rounded-3xl p-5 mb-4 relative overflow-hidden shadow-2xl shrink-0">
          {isMiningActive && (
            <motion.div 
               animate={{ opacity: [0.1, 0.2, 0.1] }} 
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-[#00f3ff]/10 to-transparent rounded-bl-full pointer-events-none"
            />
          )}
          
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <ActivitySquare size={18} className={isMiningActive ? "text-[#00f3ff]" : "text-gray-400"} />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">Mined Balance</h3>
          </div>
          
          <div className="flex items-center gap-3 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] mb-1">
            <img src="https://i.suar.me/MpXLm/l" alt="TON" className={`w-8 h-8 sm:w-10 sm:h-10 object-contain ${isMiningActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] animate-pulse' : 'grayscale opacity-70'}`} />
            <div className={`text-4xl sm:text-5xl font-black ${isMiningActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#9d00ff]' : 'text-gray-400'}`}>
              <span className="font-mono tracking-tighter">{displayBalance.toFixed(9)}</span> <span className="text-lg sm:text-2xl tracking-normal ml-1">TON</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs sm:text-sm font-mono border-t border-white/10 pt-3">
             <div className="flex flex-col gap-1">
                <span className="text-white/50 uppercase">Hashrate</span>
                <span className="text-[#00f3ff] font-bold">~{(tonMiningRate).toFixed(5)} / Day</span>
             </div>
             {isMiningActive && (
               <div className="flex flex-col items-end gap-1">
                  <span className="text-white/50 uppercase">Session Ends In</span>
                  <span className="text-white font-black tracking-wider">{timeLeft}</span>
               </div>
             )}
          </div>
        </div>

        {/* Start Mining / Upgrade Section */}
        {!isMiningActive ? (
          <button 
             onClick={() => {
               startAdSequence(
                 'int-30809',
                 () => {
                   startTonMining();
                 },
                 () => {
                   console.log("Ad incomplete or failed.");
                 }
               );
             }}
             className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#00f3ff] to-[#9d00ff] text-white font-black text-lg sm:text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,243,255,0.4)] flex items-center justify-center gap-3 shrink-0 mb-4"
          >
             <Pickaxe size={24} />
             START MINING
          </button>
        ) : (
          <div className="w-full space-y-4 shrink-0 pb-8">
            <div className="w-full bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-3">
                     <Play size={20} className="text-[#00f3ff] fill-[#00f3ff]" />
                     <span className="text-base sm:text-lg font-bold text-white">Watch Ads to Upgrade</span>
                 </div>
                 <span className="text-white/50 font-mono text-sm">{currentAdsWatched}/10</span>
              </div>
              <p className="text-xs sm:text-sm text-white/70 mb-4 leading-relaxed">
                Watch short ads to permanently increase your daily TON yield. You can watch up to 10 ads daily.
              </p>
              
              <button 
                 onClick={() => {
                   if (currentAdsWatched < 10 && !isUpgrading) {
                     startAdSequence(
                       'int-30809',
                       () => {
                         setIsUpgrading(true);
                         setTimeout(() => {
                           upgradeTonMiningViaAds();
                           setIsUpgrading(false);
                           const twa = (window as any).Telegram?.WebApp;
                           if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
                         }, 3000);
                       },
                       () => {}
                     );
                   }
                 }}
                 disabled={currentAdsWatched >= 10 || isUpgrading}
                 className="w-full py-2.5 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00f3ff] font-bold text-[13px] sm:text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-[#00f3ff]/50"
              >
                 {isUpgrading ? (
                   <>
                     <Loader2 size={18} className="animate-spin" />
                     <span>Processing...</span>
                   </>
                 ) : currentAdsWatched >= 10 ? (
                   "Daily Limit Reached"
                 ) : (
                   "Watch Video (+0.00005 TON/day)"
                 )}
              </button>
            </div>

            {/* Paid Packages Section */}
            <div className="w-full bg-[#9d00ff]/5 border border-[#9d00ff]/20 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-3">
                     <ArrowUpCircle size={20} className="text-[#9d00ff]" />
                     <span className="text-base sm:text-lg font-bold text-white">Pro Hashrate Purchase</span>
                 </div>
              </div>
              <p className="text-xs sm:text-sm text-white/70 mb-4 leading-relaxed">
                Boost your TON extraction immediately by purchasing a powerful hardware node.
              </p>
              
              <div className="space-y-3">
                {[{ title: 'Micro Node', price: 0.5, increase: 0.05 }, { title: 'Standard Node', price: 2, increase: 0.25 }, { title: 'Mega Node', price: 5, increase: 0.8 }].map((pkg, i) => (
                  <button 
                    key={i}
                    onClick={() => handlePurchase(pkg.price, pkg.increase)}
                    disabled={isUpgrading}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#9d00ff]/50 disabled:opacity-50 transition-all group"
                  >
                    <div className="flex flex-col text-left">
                       <span className="font-bold text-white text-sm">{pkg.title}</span>
                       <span className="text-xs text-[#00f3ff]">+{pkg.increase} TON/day</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#00f3ff]/10 px-3 py-1.5 rounded-lg group-hover:bg-[#00f3ff]/20 transition-colors">
                       <span className="font-bold text-white">{pkg.price}</span>
                       <img src="https://i.suar.me/MpXLm/l" alt="TON" className="w-4 h-4 object-contain drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Section */}
        <div className="w-full opacity-60 pointer-events-none text-center shrink-0 pb-8 mt-2">
           <button className="w-full py-3 bg-white/5 border border-white/10 text-white/50 font-bold rounded-2xl shadow-inner text-sm sm:text-lg flex items-center justify-center gap-2 tracking-wide uppercase">
             <span>Withdraw TON</span>
             <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full ml-2 text-white/70">Soon</span>
           </button>
        </div>
      </div>
    </motion.div>
  );
}
