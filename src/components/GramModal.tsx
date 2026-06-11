import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pickaxe, ActivitySquare, ArrowUpCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';
import { startAdSequence } from './AdSequenceOverlay';

interface GramModalProps {
  onClose: () => void;
}

export function GramModal({ onClose }: GramModalProps) {
  const { balance, gramBalance, gramMiningRate, upgradeGramMining, gramMiningActiveUntil, startGramMining } = useGameStore();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isMining, setIsMining] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(gramBalance);
  const [upgradeAmount, setUpgradeAmount] = useState<number>(100000000);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (gramMiningActiveUntil > now) {
        setIsMining(true);
        const diff = gramMiningActiveUntil - now;
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
  }, [gramMiningActiveUntil]);

  // Smooth balance ticker
  useEffect(() => {
    if (!isMining) {
      setDisplayBalance(gramBalance);
      return;
    }
    const ticker = setInterval(() => {
      const state = useGameStore.getState();
      const now = Date.now();
      const effectiveNow = Math.min(now, state.gramMiningActiveUntil);
      const diffDays = Math.max(0, (effectiveNow - state.lastGramSync) / (1000 * 60 * 60 * 24));
      setDisplayBalance(state.gramBalance + (state.gramMiningRate * diffDays));
    }, 50);
    return () => clearInterval(ticker);
  }, [isMining, gramBalance]);

  const isMiningActive = isMining;

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
        <span className="font-black text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)] tracking-widest uppercase">
          Cloud Miner
        </span>
      </div>

      <div className="w-full max-w-md px-6 flex flex-col items-center justify-center flex-1 relative overflow-y-auto overflow-x-hidden min-h-0 py-8">
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
              src="https://i.suar.me/0pvOj/l" 
              alt="Gram" 
              className={`w-full h-full object-contain ${isMiningActive ? 'drop-shadow-[0_0_25px_rgba(0,243,255,0.8)]' : 'drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] grayscale opacity-80'}`} 
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6 w-full shrink-0">
           <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
             <img src="https://i.suar.me/0pvOj/l" alt="GRAM" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
             GRAM Miner
           </h2>
           <div className="flex items-center justify-center gap-2">
             <span className={`w-2 h-2 rounded-full ${isMiningActive ? 'bg-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.8)] animate-pulse' : 'bg-red-500'}`} />
             <p className={`text-sm tracking-widest font-bold uppercase ${isMiningActive ? 'text-[#00f3ff]' : 'text-red-500'}`}>
                {isMiningActive ? "Mining Array Active" : "Mining Array Offline"}
             </p>
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
            <img src="https://i.suar.me/0pvOj/l" alt="GRAM" className={`w-8 h-8 sm:w-10 sm:h-10 object-contain ${isMiningActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] animate-pulse' : 'grayscale opacity-70'}`} />
            <div className={`text-4xl sm:text-5xl font-black ${isMiningActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ffaa00] to-[#00f3ff]' : 'text-gray-400'}`}>
              <span className="font-mono tracking-tighter">{displayBalance.toFixed(9)}</span> <span className="text-lg sm:text-2xl tracking-normal ml-1">GRAM</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs sm:text-sm font-mono border-t border-white/10 pt-3">
             <div className="flex flex-col gap-1">
                <span className="text-white/50 uppercase">Hashrate</span>
                <span className="text-[#00f3ff] font-bold">~{(gramMiningRate).toFixed(5)} / Day</span>
             </div>
             {isMiningActive && (
               <div className="flex flex-col items-end gap-1">
                  <span className="text-white/50 uppercase">Session Ends In</span>
                  <span className="text-white font-black tracking-wider">{timeLeft}</span>
               </div>
             )}
          </div>
        </div>

        {/* Start Mining Button / Upgrade Rig */}
        {!isMiningActive ? (
          <button 
             onClick={() => {
               startAdSequence(
                 'int-30809',
                 () => {
                   startGramMining();
                 },
                 () => {
                   console.log("Ad incomplete or failed.");
                 }
               );
             }}
             className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#ffaa00] to-[#00f3ff] text-black font-black text-lg sm:text-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,243,255,0.4)] flex items-center justify-center gap-3 shrink-0"
          >
             <Pickaxe size={24} />
             START MINING
          </button>
        ) : (
          <div className="w-full space-y-3 shrink-0">
            <div className="w-full bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-2xl p-4 mb-2">
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-3">
                     <ArrowUpCircle size={20} className="text-[#00f3ff]" />
                     <span className="text-base sm:text-lg font-bold text-white">Upgrade Rig</span>
                 </div>
              </div>
              <p className="text-xs sm:text-sm text-white/70 mb-3 leading-relaxed">
                Boost your hardware to permanently increase your daily GRAM yield. (Min 100M Coins)
              </p>
              
              <div className="flex items-center gap-2 mb-4 bg-black/40 border border-white/10 rounded-xl p-2">
                 <img src="https://i.suar.me/qv4lV/l" alt="Coins" className="w-5 h-5 ml-2 object-contain" />
                 <input 
                   type="number"
                   value={upgradeAmount || ""}
                   onChange={(e) => setUpgradeAmount(Number(e.target.value))}
                   min={100000000}
                   step={1000000}
                   className="bg-transparent text-white font-mono flex-1 outline-none font-bold"
                 />
              </div>

              <button 
                 onClick={() => {
                   if (upgradeAmount >= 100000000 && balance >= upgradeAmount && !isUpgrading) {
                     setIsUpgrading(true);
                     setTimeout(() => {
                       upgradeGramMining(upgradeAmount);
                       setIsUpgrading(false);
                     }, 3000);
                   }
                 }}
                 disabled={balance < upgradeAmount || upgradeAmount < 100000000 || isUpgrading}
                 className="w-full py-2.5 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00f3ff] font-bold text-[13px] sm:text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-[#00f3ff]/50"
              >
                 {isUpgrading ? (
                   <>
                     <Loader2 size={18} className="animate-spin" />
                     <span>Processing...</span>
                   </>
                 ) : balance < upgradeAmount ? (
                   "Insufficient Coins"
                 ) : (
                   "Upgrade Hashrate"
                 )}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Section */}
        <div className="w-full mt-2 opacity-60 pointer-events-none text-center shrink-0 mb-4">
           <button className="w-full py-3 bg-white/5 border border-white/10 text-white/50 font-bold rounded-2xl shadow-inner text-sm sm:text-lg flex items-center justify-center gap-2 tracking-wide uppercase">
             <span>Withdraw GRAM</span>
             <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full ml-2 text-white/70">Soon</span>
           </button>
        </div>
      </div>
    </motion.div>
  );
}
