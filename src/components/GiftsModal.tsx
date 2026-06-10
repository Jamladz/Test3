import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface GiftsModalProps {
  onClose: () => void;
}

export function GiftsModal({ onClose }: GiftsModalProps) {
  const { gifts } = useGameStore();

  const handleWithdraw = () => {
    // Simulating withdraw logic or just visual feedback.
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
    alert("Withdrawal requested! (Coming Soon)");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pb-20 sm:pb-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1c1c1e] sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[85vh] flex flex-col"
      >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#00f3ff]/10 to-transparent rounded-t-3xl pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all active:scale-90 z-50 shadow-md"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center mb-6 relative z-10 pt-4">
             <div className="w-20 h-20 bg-black/40 rounded-3xl mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.1)] border border-white/5">
                <img src="https://i.suar.me/GnMx9/l" alt="Gifts Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]" />
             </div>
             <h2 className="text-2xl font-black text-white text-center tracking-tight">Gifts</h2>
             <p className="text-sm text-gray-400 mt-1 mb-2 text-center max-w-[280px]">
                Collect exclusive gifts from the lucky spinner to withdraw.
             </p>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 scrollbar-hide -mx-2 px-2">
             {gifts && gifts.length > 0 ? (
                 <div className="grid grid-cols-3 gap-3">
                     {gifts.map((giftUrl, idx) => (
                         <div key={idx} className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 shadow-inner">
                            <img src={giftUrl} alt={`Gift ${idx}`} className="w-full h-full object-contain" />
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                     <Gift size={48} className="text-[#00f3ff] mb-4 opacity-50" />
                     <p className="text-lg font-medium text-white mb-1">No gifts available currently</p>
                     <p className="text-sm text-gray-500">Spin the wheel to earn amazing rewards!</p>
                 </div>
             )}
          </div>

          <button
             onClick={handleWithdraw}
             disabled={!gifts || gifts.length === 0}
             className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00f3ff] to-blue-600 font-bold text-white shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             Withdraw Gifts
          </button>
        </motion.div>
      </motion.div>
  );
}
