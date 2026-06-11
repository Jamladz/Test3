import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { Zap, Coins, FerrisWheel, Map, X, CheckCircle2, Wallet, Vault } from 'lucide-react';
import { audioManager } from '../lib/audio';
import { CaseOpeningSpinner } from '../components/CaseOpeningSpinner';
import { GramModal } from '../components/GramModal';
import { GiftsModal } from '../components/GiftsModal';
import { TonModal } from '../components/TonModal';

export function Game() {
  const { balance, energy, maxEnergy, tapMultiplier, addBalance, reduceEnergy, increaseEnergy, offlineEarnings, claimOfflineEarnings } = useGameStore();
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const tapIdRef = useRef(0);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showAirdropPopup, setShowAirdropPopup] = useState(false);
  const [showVaultPopup, setShowVaultPopup] = useState(false);
  const [showGramModal, setShowGramModal] = useState(false);
  const [showTonModal, setShowTonModal] = useState(false);
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const [showGoToSpinPopup, setShowGoToSpinPopup] = useState(false);

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
    <div 
      className="flex flex-col items-center flex-1 w-full px-4 pt-0 pb-1 relative select-none min-h-0 overflow-y-auto no-scrollbar"
      style={{
        backgroundImage: 'url("https://i.suar.me/3zzxd/l")',
        backgroundSize: 'cover',
        backgroundPosition: 'center -140px',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30 w-full h-full pointer-events-none z-0" />
      
      {/* Header Balance Area */}
      <div className="flex flex-col items-center justify-center w-full pt-1 pb-1 shrink-0 z-10">
        <div className="flex items-center justify-center gap-3 h-12 w-full">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]" />
          </div>
          <h1 className="text-[2.5rem] md:text-5xl leading-none font-bold tracking-tight font-mono drop-shadow-lg text-white">
            {formatCurrency(balance)}
          </h1>
        </div>
      </div>

      {/* Left Side Floating Buttons */}
      <div className="absolute left-4 top-24 flex flex-col gap-4 z-40">
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowGramModal(true);
          }}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-white/10 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[#00f3ff]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <img src="https://i.suar.me/0pvOj/l" alt="Gram" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" />
        </button>
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowGiftsModal(true);
          }}
          className="w-12 h-12 rounded-2xl active:scale-95 transition-all relative overflow-hidden group shadow-[0_0_15px_rgba(0,243,255,0.3)] bg-transparent"
        >
          <img src="https://i.suar.me/4zynX/l" alt="Gifts" className="w-full h-full object-contain" />
        </button>
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowTonModal(true);
          }}
          className="w-12 h-12 rounded-2xl active:scale-95 transition-all relative overflow-hidden group shadow-[0_0_15px_rgba(0,243,255,0.3)] bg-transparent mt-2"
        >
          <img src="https://i.suar.me/9zy98/l" alt="TON Mining" className="w-full h-full object-contain" />
        </button>
      </div>

      {/* Right Side Floating Buttons */}
      <div className="absolute right-4 top-24 flex flex-col gap-4 z-40">
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowRoadmap(true);
          }}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-95 transition-all text-[#00f3ff] hover:bg-white/10"
        >
          <Map size={22} className="drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
        </button>
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowWheel(true);
          }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(255,170,0,0.15)] active:scale-95 transition-all relative overflow-hidden group hover:shadow-[0_0_20px_rgba(255,170,0,0.3)] bg-[#1a1a24] border border-[#ffaa00]/30 p-0.5"
        >
          <img src="https://i.suar.me/PpW1r/l" alt="Spin" className="w-full h-full rounded-[14px] object-cover transition-transform group-hover:scale-110" />
        </button>
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowAirdropPopup(true);
          }}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-95 transition-all text-[#ff7b00] hover:bg-white/10"
        >
          <Wallet size={22} className="drop-shadow-[0_0_8px_rgba(255,123,0,0.8)]" />
        </button>
        <button 
          onClick={() => {
            const twa = (window as any).Telegram?.WebApp;
            if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
            setShowVaultPopup(true);
          }}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-95 transition-all text-[#00f3ff] hover:bg-white/10"
        >
          <Vault size={22} className="drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
        </button>
      </div>

      {/* Main Tap Area */}
      <div className="flex flex-row items-center justify-center w-full px-2 md:px-6 my-auto shrink-[1] min-h-[240px]">
        <div 
          className="relative w-64 h-64 md:w-[320px] md:h-[320px] sm:w-[280px] sm:h-[280px] max-w-full flex items-center justify-center cursor-pointer touch-none"
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
                <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-full h-full object-contain animate-bounce drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-gray-400 mb-6 text-sm">Your plushie collected coins while you were sleeping.</p>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 w-full mb-6">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Offline Profit</div>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-6 h-6 object-contain" />
                  <span className="text-3xl font-bold text-[#FFD700]">+{formatCurrency(offlineEarnings)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  audioManager.playCoinSound();
                  claimOfflineEarnings();
                  setShowGoToSpinPopup(true);
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-black font-bold text-lg shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Claim Coins
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roadmap Modal */}
      <AnimatePresence>
        {showRoadmap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#151515] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setShowRoadmap(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#00f3ff]/20 via-[#00f3ff]/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8 mt-2 relative z-10 shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-[#00f3ff]/20 to-transparent rounded-2xl flex items-center justify-center border border-[#00f3ff]/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                  <Map className="text-[#00f3ff]" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Roadmap</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse" />
                    <p className="text-sm font-medium text-[#00f3ff] tracking-wide">Path to CEX Listing</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Timeline Array */}
              <div className="space-y-6 relative z-10 overflow-y-auto no-scrollbar pb-4 pr-1 flex-1">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-6 bottom-16 w-0.5 bg-gradient-to-b from-[#00f3ff] via-white/10 to-white/10 rounded-full" />
                
                {/* Phase 1 - Active */}
                <div className="relative pl-14">
                  <div className="absolute left-0 top-3 w-10 h-10 rounded-full bg-[#151515] border-2 border-[#00f3ff] z-10 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                    <div className="w-3 h-3 rounded-full bg-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                  </div>
                  <div className="bg-gradient-to-br from-[#00f3ff]/10 to-transparent border border-[#00f3ff]/30 rounded-2xl p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-[#00f3ff] uppercase tracking-widest bg-[#00f3ff]/10 px-2 py-0.5 rounded-full">Active</span>
                       <span className="text-[10px] text-white/50 font-mono">Q1 Phase 1</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-1.5">Genesis Launch</h3>
                    <p className="text-xs text-white/70 leading-relaxed">Community building, core tap game mechanics, daily rewards, and early adopter bonuses.</p>
                  </div>
                </div>

                {/* Phase 2 - Upcoming */}
                <div className="relative pl-14">
                  <div className="absolute left-[7px] top-4 w-6 h-6 rounded-full bg-[#151515] border-2 border-white/20 z-10 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Upcoming</span>
                       <span className="text-[10px] text-white/30 font-mono">Q2 Phase 2</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-1.5 opacity-90">Ecosystem Growth</h3>
                    <p className="text-xs text-white/40 leading-relaxed">Strategic global partnerships, expanded social tasks, team squads, and game economy balancing.</p>
                  </div>
                </div>
                
                {/* Phase 3 - Upcoming */}
                <div className="relative pl-14">
                  <div className="absolute left-[7px] top-4 w-6 h-6 rounded-full bg-[#151515] border-2 border-white/20 z-10 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Upcoming</span>
                       <span className="text-[10px] text-white/30 font-mono">Q3 Phase 3</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-1.5 opacity-90">The Snapshot</h3>
                    <p className="text-xs text-white/40 leading-relaxed">Final user balance snapshots, anti-cheat sweeps, pre-market trading, and allocations.</p>
                  </div>
                </div>

                {/* Phase 4 - Destination */}
                <div className="relative pl-14 mt-4">
                  <div className="absolute left-0 top-3 w-10 h-10 rounded-full bg-[#151515] border-2 border-[#FFD700] z-10 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                    <CheckCircle2 size={20} className="text-[#FFD700]" />
                  </div>
                  <div className="bg-gradient-to-br from-[#FFD700]/5 to-transparent border border-[#FFD700]/20 rounded-2xl p-4 shadow-lg overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#FFD700]/10 blur-xl rounded-full" />
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest bg-[#FFD700]/10 px-2 py-0.5 rounded-full">Destination</span>
                       <span className="text-[10px] text-[#FFD700]/50 font-mono">Q4 Phase 4</span>
                    </div>
                    <h3 className="text-[#FFD700] font-bold text-base mb-1.5">TGE & Exchange Listing</h3>
                    <p className="text-xs text-white/60 leading-relaxed">Token Generation Event, official Airdrop distribution to active players, and major Tier-1 Exchange listings.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wheel of Fortune Modal */}
      <AnimatePresence>
        {showWheel && (
           <CaseOpeningSpinner onClose={() => setShowWheel(false)} />
        )}
      </AnimatePresence>

      {/* Airdrop Popup Modal */}
      <AnimatePresence>
        {showAirdropPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] border border-white/10 p-6 rounded-3xl flex flex-col items-center w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAirdropPopup(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="w-20 h-20 bg-gradient-to-tr from-[#00f3ff]/20 to-[#ff7b00]/20 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,123,0,0.3)]">
                <Wallet size={36} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Airdrop Balance</h2>
              
              <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl w-full p-6 mb-6">
                 <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff7b00] drop-shadow-[0_0_10px_rgba(255,123,0,0.3)] mb-2">
                    {(balance / 10000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </div>
                 <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Plush Tokens</span>
                 <div className="mt-4 text-[11px] text-white/40 text-center">
                   Rate: 1,000,000,000 Coins = 100 Tokens
                 </div>
              </div>

              <button 
                onClick={(e) => {
                  const target = e.currentTarget;
                  target.innerText = "Coming Soon...";
                  target.classList.add("opacity-50", "cursor-not-allowed");
                  setTimeout(() => {
                    target.innerText = "Withdraw";
                    target.classList.remove("opacity-50", "cursor-not-allowed");
                  }, 2000);
                }}
                className="w-full py-4 bg-gradient-to-r from-[#00f3ff] to-[#ff7b00] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(255,123,0,0.4)] hover:brightness-110 active:scale-95 transition-all mb-3 text-lg"
              >
                Withdraw
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vault Popup Modal */}
      <AnimatePresence>
        {showVaultPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] border border-white/10 p-6 rounded-3xl flex flex-col w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowVaultPopup(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="w-20 h-20 bg-gradient-to-tr from-[#00f3ff]/20 to-[#00f3ff]/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-[0_0_30px_rgba(0,243,255,0.3)]">
                <Vault size={36} className="text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Tokenomics</h2>
              
              <div className="flex flex-col bg-black/40 border border-white/5 rounded-2xl w-full p-6 mb-4">
                 <span className="text-xs text-white/50 w-full text-left uppercase tracking-widest font-bold mb-1">Total Supply</span>
                 <div className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    100,000,000 <span className="text-[#00f3ff]">$PLUSH</span>
                 </div>
              </div>

              <div className="bg-[#00f3ff]/10 border border-[#00f3ff]/20 rounded-2xl p-4 mb-6">
                <p className="text-sm text-white/80 leading-relaxed text-center">
                  Get ready! The <strong className="text-[#00f3ff]">$PLUSH</strong> token will soon be officially listed on top centralized (CEX) and decentralized exchanges (DEX). Keep tapping!
                </p>
              </div>

              <button 
                onClick={() => setShowVaultPopup(false)}
                className="w-full py-4 bg-gradient-to-r from-[#00f3ff] to-[#ffaa00] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:brightness-110 active:scale-95 transition-all text-lg"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Go To Spin Promo Popup */}
      <AnimatePresence>
        {showGoToSpinPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] border border-white/10 p-6 rounded-3xl flex flex-col items-center w-full max-w-xs shadow-2xl relative"
            >
              <button 
                onClick={() => setShowGoToSpinPopup(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="w-24 h-24 mb-6 mt-4 p-1 rounded-3xl bg-[#1a1a24] border border-[#ffaa00]/30 shadow-[0_0_40px_rgba(255,170,0,0.3)] relative flex items-center justify-center group">
                <div className="absolute inset-0 rounded-3xl animate-pulse bg-[#ffaa00]/10"></div>
                <div className="absolute inset-0 rounded-3xl border-2 border-[#ffaa00]/20 scale-105 opacity-50"></div>
                <img src="https://i.suar.me/PpW1r/l" alt="Spin" className="w-full h-full rounded-[20px] object-cover relative z-10 drop-shadow-[0_0_15px_rgba(255,170,0,0.3)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Bonus Spin Ready!</h2>
              <p className="text-sm text-white/70 text-center mb-6">
                You have daily spins left. Try your luck and win big rewards right now!
              </p>

              <button 
                onClick={() => {
                  setShowGoToSpinPopup(false);
                  setShowWheel(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-[#ffaa00] to-[#ffcc00] text-black font-black rounded-xl shadow-[0_0_15px_rgba(255,170,0,0.4)] hover:brightness-110 active:scale-95 transition-all text-lg"
              >
                Go to Spin
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showGramModal && <GramModal onClose={() => setShowGramModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
         {showTonModal && <TonModal onClose={() => setShowTonModal(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showGiftsModal && <GiftsModal onClose={() => setShowGiftsModal(false)} />}
      </AnimatePresence>

    </div>
  );
}
