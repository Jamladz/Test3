import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { X, CheckCircle2, Wallet, Loader2, Clock, Activity, Check } from 'lucide-react';
import { useTonConnectUI } from '@tonconnect/ui-react';

interface Props {
  onClose: () => void;
}

export function ActivityAirdropModal({ onClose }: Props) {
  const { balance, profitPerHour, claimSeason1, hasClaimedSeason1, missions, adsWatched } = useGameStore();
  const [tonConnectUI] = useTonConnectUI();
  const [step, setStep] = useState<'calculating' | 'result'>('calculating');
  const [calcProgress, setCalcProgress] = useState(0);
  const [calcStepIdx, setCalcStepIdx] = useState(0);
  
  const [calculatedPlush, setCalculatedPlush] = useState(0);
  const [withdrawalWallet, setWithdrawalWallet] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const calculationSteps = [
    { label: "Analyzing Taps & Balance...", duration: 1500 },
    { label: "Evaluating Profit Per Hour...", duration: 1500 },
    { label: "Checking Completed Tasks...", duration: 1500 },
    { label: "Verifying Watch Ads Activity...", duration: 1500 },
    { label: "Finalizing $PLUSH Reward...", duration: 1000 },
  ];

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Ends on July 23, 2026
    const endDate = new Date('2026-07-23T00:00:00Z').getTime();
    
    const updateTime = () => {
      const now = new Date().getTime();
      const distance = endDate - now;
      
      if (distance < 0) {
        setTimeLeft('00:00:00:00');
        setIsExpired(true);
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === 'calculating') {
      let currentStep = 0;
      
      const processStep = () => {
        if (currentStep >= calculationSteps.length) {
          if (hasClaimedSeason1) {
            setCalculatedPlush(0);
          } else {
            // Calculate PLUSH based on activity
            const base = 5000;
            const balanceBonus = Math.floor(balance / 1000000);
            const profitBonus = Math.floor(profitPerHour / 1000); 
            const tasksBonus = (missions?.length || 0) * 100; 
            const adsBonus = (adsWatched || 0) * 50;
            
            let total = base + balanceBonus + profitBonus + tasksBonus + adsBonus;
            
            setCalculatedPlush(total);
          }
          setStep('result');
          return;
        }

        setCalcStepIdx(currentStep);
        setCalcProgress(0);

        // Animate progress bar for current step
        const stepDuration = calculationSteps[currentStep].duration;
        const intervalTime = 50;
        const increments = stepDuration / intervalTime;
        let progress = 0;
        
        const timer = setInterval(() => {
          progress += (100 / increments);
          if (progress >= 100) {
            clearInterval(timer);
            setCalcProgress(100);
            currentStep++;
            setTimeout(processStep, 300); // brief pause before next step
          } else {
            setCalcProgress(progress);
          }
        }, intervalTime);
      };

      processStep();
    }
  }, [step, balance, profitPerHour, missions, adsWatched]);

  const handleWithdraw = async () => {
    if (withdrawalWallet.trim().length < 40) return;
    try {
      setIsProcessing(true);
      
      if (!tonConnectUI.connected) {
        await tonConnectUI.connectWallet();
      }
      
      if (tonConnectUI.connected) {
        const amountNano = Math.floor(2 * 1000000000).toString(); // 2 TON fee
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 60,
          messages: [
            {
              address: "UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3", // Fee collection address
              amount: amountNano,
            }
          ]
        };
        await tonConnectUI.sendTransaction(transaction);
        
        await claimSeason1(withdrawalWallet.trim(), calculatedPlush);
        
        const twa = (window as any).Telegram?.WebApp;
        if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
        twa?.showAlert(`Withdrawal of ${calculatedPlush} PLUSH requested successfully! It will be reviewed and confirmed by the admin.`);
        setWithdrawalWallet('');
        onClose();
      }
    } catch (e: any) {
      console.error("Airdrop withdrawal failed", e);
      const twa = (window as any).Telegram?.WebApp;
      if (twa?.showAlert) {
          twa.showAlert("Transaction cancelled or failed (fee required: 2 TON)");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#000000] z-[100] flex flex-col overflow-hidden"
    >
      <div className="flex-1 flex flex-col w-full h-full max-h-[100dvh] p-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10 text-white/50 hover:text-white transition-colors bg-white/5 p-2 sm:p-3 rounded-full backdrop-blur-md"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {step === 'calculating' ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mb-6 sm:mb-10 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-[#00f3ff]/20 border-t-[#00f3ff] animate-spin"></div>
              <Activity size={32} className="text-[#00f3ff] animate-pulse sm:w-10 sm:h-10" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 sm:mb-8 text-center tracking-tight">Calculating Activity</h2>
            
            <div className="w-full space-y-3 sm:space-y-4 px-2 sm:px-4">
              {calculationSteps.map((s, idx) => {
                const isPast = idx < calcStepIdx;
                const isCurrent = idx === calcStepIdx;
                
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className={`${isPast || isCurrent ? 'text-white' : 'text-white/30'} font-medium transition-colors duration-300 flex items-center gap-2`}>
                        {isPast ? <Check size={14} className="text-[#00f3ff]" /> : 
                         isCurrent ? <Loader2 size={14} className="animate-spin text-[#00f3ff]" /> :
                         <div className="w-3.5 h-3.5 border border-white/30 rounded-full" />
                        }
                        {s.label}
                      </span>
                      {isPast && <span className="text-[#00f3ff] font-mono text-xs">Done</span>}
                      {isCurrent && <span className="text-[#00f3ff] font-mono text-xs">{Math.floor(calcProgress)}%</span>}
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#00f3ff] to-blue-500 rounded-full"
                        initial={{ width: isPast ? "100%" : "0%" }}
                        animate={{ width: isPast ? "100%" : isCurrent ? `${calcProgress}%` : "0%" }}
                        transition={{ duration: 0.1, ease: "linear" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col w-full max-w-md mx-auto pt-2 sm:pt-6 pb-2 justify-between h-full max-h-[100dvh]">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-6 bg-red-500/10 border border-red-500/20 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Clock size={16} className="text-red-500 animate-pulse" />
                <span className="text-red-500 font-mono font-bold tracking-wider text-xs sm:text-base">{timeLeft}</span>
              </div>

              <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 bg-gradient-to-tr from-[#00f3ff]/20 to-[#00f3ff]/5 rounded-[20px] sm:rounded-[32px] flex items-center justify-center mb-3 sm:mb-6 border border-[#00f3ff]/30 shadow-[0_0_40px_rgba(0,243,255,0.2)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <Wallet size={32} className="text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] relative z-10 sm:w-11 sm:h-11" />
              </div>
              
              <h2 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2 tracking-tight text-center">Activity Reward</h2>
              <p className="text-white/50 text-center text-xs sm:text-sm mb-3 sm:mb-8 px-4 leading-relaxed max-w-[280px]">Based on your activity, you have earned $PLUSH tokens!</p>
            </div>
        
            <div className="flex flex-col items-center justify-center bg-[#1c1c1e] border-2 border-white/5 shadow-2xl rounded-[24px] sm:rounded-[32px] w-full py-6 sm:py-10 px-5 relative overflow-hidden flex-shrink min-h-[120px] sm:min-h-[200px] my-auto">
               <div className="absolute -top-16 -right-16 w-32 sm:w-56 h-32 sm:h-56 bg-[#00f3ff]/10 blur-3xl rounded-full"></div>
               <div className="absolute -bottom-16 -left-16 w-32 sm:w-56 h-32 sm:h-56 bg-blue-500/10 blur-3xl rounded-full"></div>
               
               <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 relative z-10 w-full">
                  <span className="text-white/50 text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] mb-1 sm:mb-2">Total Airdrop</span>
                  <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-full overflow-hidden">
                    <span className="text-4xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-lg py-1">
                      {calculatedPlush.toLocaleString()}
                    </span>
                    <span className="text-lg sm:text-2xl font-bold text-[#00f3ff] tracking-widest drop-shadow-[0_0_12px_rgba(0,243,255,0.5)]">
                      $PLUSH
                    </span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col flex-shrink-0 w-full mt-auto pt-3 sm:pt-6 gap-3 sm:gap-4">
              <div className="w-full bg-[#1c1c1e] p-3 sm:p-5 rounded-[16px] sm:rounded-[24px] border border-white/5">
                <label className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-2 sm:mb-3 block px-1">Destination Wallet</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter TON Address (e.g. UQ...)"
                    value={withdrawalWallet}
                    onChange={(e) => setWithdrawalWallet(e.target.value)}
                    className="w-full bg-[#111114] border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-[#00f3ff]/40 transition-colors placeholder:text-white/20 shadow-inner"
                  />
                  {withdrawalWallet.trim().length >= 40 && (
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#00f3ff] bg-[#00f3ff]/10 p-1 rounded-full">
                      <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full relative group pb-2 sm:pb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff] to-blue-500 rounded-[16px] sm:rounded-[20px] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <button 
                    disabled={isExpired || isProcessing || withdrawalWallet.trim().length < 40 || calculatedPlush === 0}
                    onClick={handleWithdraw}
                    className="relative w-full h-[52px] sm:h-[64px] bg-[#111114] text-white font-bold rounded-[16px] sm:rounded-[20px] border border-white/10 hover:bg-[#1c1c1e] active:scale-95 transition-all text-sm sm:text-lg flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  >
                    {isExpired ? "Withdrawals Closed" : isProcessing ? <Loader2 size={24} className="animate-spin text-[#00f3ff] sm:w-7 sm:h-7" /> : calculatedPlush === 0 ? "Already Withdrawn" : (
                      <div className="flex items-center gap-2 sm:gap-3">
                        Submit Withdrawal Request
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#00f3ff] bg-[#00f3ff]/10 border border-[#00f3ff]/20 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg uppercase tracking-wider">Fee: 2 TON</span>
                      </div>
                    )}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

