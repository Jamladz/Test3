import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { Zap, Coins } from 'lucide-react';

export function Game() {
  const { balance, energy, maxEnergy, tapMultiplier, addBalance, reduceEnergy, increaseEnergy, offlineEarnings, claimOfflineEarnings } = useGameStore();
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const tapIdRef = useRef(0);

  // Energy regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      if (energy < maxEnergy) {
        increaseEnergy(3); // +3 energy per second
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [energy, maxEnergy, increaseEnergy]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default touch behavior
    
    // Support multi-touch
    let clientXs: number[] = [];
    let clientYs: number[] = [];

    if ('touches' in e) {
      for (let i = 0; i < e.touches.length; i++) {
        clientXs.push(e.touches[i].clientX);
        clientYs.push(e.touches[i].clientY);
      }
    } else {
      clientXs.push(e.clientX);
      clientYs.push(e.clientY);
    }

    // Trigger haptic feedback if available (Telegram WebApp SDK)
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) {
      twa.HapticFeedback.impactOccurred('light');
    } else if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const tapsCount = clientXs.length;
    const requiredEnergy = tapsCount * tapMultiplier;

    if (reduceEnergy(requiredEnergy)) {
      addBalance(requiredEnergy);

      const newTaps = clientXs.map((x, idx) => ({
        id: tapIdRef.current++,
        x,
        y: clientYs[idx]
      }));

      setTaps((prev) => [...prev, ...newTaps]);

      // Remove floating numbers after animation
      setTimeout(() => {
        setTaps((prev) => prev.filter((t) => !newTaps.find(nt => nt.id === t.id)));
      }, 1000);
    }
  };

  const energyPercentage = (energy / maxEnergy) * 100;

  return (
    <div className="flex flex-col items-center flex-1 w-full px-4 pt-0 pb-1 relative select-none min-h-0 overflow-y-auto no-scrollbar">
      
      {/* Header Balance Area */}
      <div className="flex flex-col items-center justify-center w-full pt-1 pb-1 shrink-0">
        <div className="flex items-center justify-center gap-3 h-12 w-full">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />
          </div>
          <h1 className="text-[2.5rem] md:text-5xl leading-none font-bold tracking-tight font-mono drop-shadow-lg text-white">
            {formatCurrency(balance)}
          </h1>
        </div>
      </div>

      {/* Main Tap Area */}
      <div 
        className="relative w-56 h-56 md:w-[300px] md:h-[300px] sm:w-[260px] sm:h-[260px] max-w-full flex items-center justify-center cursor-pointer touch-none my-auto shrink-[1] min-h-[220px]"
        onPointerDown={handleTap}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff8a00]/10 to-[#e52e71]/10 rounded-full blur-3xl" />
        <motion.div 
          className="w-full h-full flex items-center justify-center relative z-10"
          whileTap={{ scale: 0.92, rotate: Math.random() > 0.5 ? -3 : 3 }}
          transition={{ type: "spring", stiffness: 350, damping: 15 }}
        >
           <img 
             src="https://i.suar.me/Pp1p0/l" 
             alt="Tap Avatar" 
             className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
           />
        </motion.div>
      </div>

      {/* Floating Numbers */}
      <AnimatePresence>

        {taps.map((tap) => (
          <motion.div
            key={tap.id}
            initial={{ opacity: 1, y: 0, x: '-50%' }}
            animate={{ opacity: 0, y: -150 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed pointer-events-none text-4xl font-bold text-white z-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ left: tap.x, top: tap.y }}
          >
            +{tapMultiplier}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Energy Bar */}
      <div className="w-full max-w-sm mt-0 pt-0 pb-1 relative z-10 shrink-0">
        <div className="flex justify-between items-center mb-1 px-3">
          <div className="flex items-center gap-2 text-white">
            <Zap size={18} fill="#FFD700" className="text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
            <span className="font-mono font-bold text-base">{formatNumber(Math.floor(energy))} <span className="text-white/50 text-sm">/ {formatNumber(maxEnergy)}</span></span>
          </div>
        </div>
        <div className="w-full h-3 bg-[#1c1c1e] rounded-full overflow-hidden border border-white/10 relative shadow-inner p-[1.5px]">
          <div 
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#ffaa00] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,215,0,0.5)]"
            style={{ width: `${energyPercentage}%` }}
          />
        </div>
      </div>

      {/* Offline Earnings Popup */}
      <AnimatePresence>
        {offlineEarnings > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div 
              className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#FFD700]/20 to-transparent pointer-events-none" />
              
              <div className="w-24 h-24 mb-6 relative">
                <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-full h-full object-contain animate-bounce drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-gray-400 mb-6 text-sm">Your plushie collected coins while you were sleeping.</p>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 w-full mb-6">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Offline Profit</div>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-6 h-6 object-contain" />
                  <span className="text-3xl font-bold text-[#FFD700]">+{formatCurrency(offlineEarnings)}</span>
                </div>
              </div>
              
              <button 
                onClick={claimOfflineEarnings}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-black font-bold text-lg shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Claim Coins
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
