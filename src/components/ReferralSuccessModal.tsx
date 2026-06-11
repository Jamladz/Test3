import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Gift, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ReferralSuccessModal() {
  const { justReferred, clearJustReferred } = useGameStore();

  return (
    <AnimatePresence>
      {justReferred && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#111114] border border-[#00f3ff]/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,243,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#00f3ff]/10 to-transparent pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-[#00f3ff]/20 flex items-center justify-center mb-4 relative">
               <div className="absolute inset-0 rounded-full animate-ping bg-[#00f3ff]/20" />
               <Gift className="w-8 h-8 text-[#00f3ff]" />
            </div>

            <h2 className="text-2xl font-black italic tracking-widest text-white mb-2 uppercase">Welcome Bonus!</h2>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              You were successfully referred! <br/>
              <strong className="text-[#FFD700]">+50,000 Coins</strong> have been added to your balance.
            </p>

            <button
              onClick={clearJustReferred}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#ffaa00] font-bold text-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle2 size={18} />
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
