import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { X, User, Play, MonitorPlay, Users } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { username, balance, adsWatched, totalSpins, friendsCount } = useGameStore();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#1c1c1e] border-t border-white/10 sm:border sm:rounded-3xl rounded-t-3xl pt-2 pb-6 px-6 w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center mt-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#ffaa00] to-[#00f3ff] rounded-full p-1 mb-4">
            <div className="w-full h-full bg-[#1c1c1e] rounded-full flex items-center justify-center">
               <User size={40} className="text-[#00f3ff]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{username || 'Player1'}</h2>
          <span className="text-xs text-[#00f3ff] uppercase tracking-widest font-bold">PlushTap Player</span>
        </div>
        
        <div className="space-y-3 mb-6">
           <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-6 h-6 object-contain" />
                 <span className="text-sm text-gray-300 font-bold">Current Coins</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(balance)}</span>
           </div>
           
           <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <MonitorPlay className="w-6 h-6 text-[#FFD700]" />
                 <span className="text-sm text-gray-300 font-bold">Ads Watched</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(adsWatched)}</span>
           </div>

           <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <Play className="w-6 h-6 text-[#FFD700]" />
                 <span className="text-sm text-gray-300 font-bold">Total Spins</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(totalSpins)}</span>
           </div>

           <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <Users className="w-6 h-6 text-[#00f3ff]" />
                 <span className="text-sm text-gray-300 font-bold">Friends Invited</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(friendsCount)}</span>
           </div>
        </div>

        <button 
          onClick={(e) => {
            const btn = e.currentTarget;
            btn.innerText = "Coming Soon";
            btn.classList.add("opacity-50");
            setTimeout(() => {
              btn.innerText = "Reward";
              btn.classList.remove("opacity-50");
            }, 2000);
          }}
          className="w-full py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 active:scale-95 transition-all text-sm"
        >
          Reward
        </button>
      </motion.div>
    </motion.div>
  );
}
