import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatNumber, plushPToPlush } from '../lib/utils';
import { Trophy, Award, Sparkles, CheckCircle2, X, Zap, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface Season1ModalProps {
  onClose: () => void;
}

export function Season1Modal({ onClose }: Season1ModalProps) {
  const { season1Stats, claimSeason1Bonus } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/30 rounded-3xl p-4 sm:p-6 text-white shadow-2xl my-auto"
      >
        {/* Glowing backdrop circle */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
            Season 1 Recap
          </span>
          <button 
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white p-1.5 px-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 transition-colors"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 mb-2.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
              <Trophy size={28} className="text-amber-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Season 1 Results</h2>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Your confirmed mining records from Plush Pepe Season 1</p>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2.5 mb-5">
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400 shrink-0">
                <Coins size={18} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] text-zinc-400">Total Tokens Mined</p>
                <p className="text-xs sm:text-sm font-bold text-white truncate">{formatNumber(plushPToPlush(season1Stats.minedTokens))} $PLUSH ({formatNumber(season1Stats.minedTokens)} PlushP)</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 shrink-0">
                <Award size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-400">Global Leaderboard Rank</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400">Rank #{season1Stats.rank}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400 shrink-0">
                <Zap size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-400">Achieved Tier</p>
                <p className="text-xs font-bold text-blue-300">{season1Stats.tier}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-center">
            <p className="text-[10px] text-amber-300 font-bold mb-0.5">Confirmed Airdrop Allocation</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400">{formatNumber(plushPToPlush(season1Stats.estimatedAllocation))} $PLUSH</p>
            <p className="text-[10px] text-zinc-400 font-bold">{formatNumber(season1Stats.estimatedAllocation)} PlushP</p>
          </div>
        </div>

        {/* Claim Action */}
        <div className="space-y-2">
          {season1Stats.claimedBonus ? (
            <div className="w-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              Season 1 Reward Claimed (+5,000 $PLUSH)
            </div>
          ) : (
            <button
              onClick={claimSeason1Bonus}
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black py-3 rounded-2xl text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Claim Season 1 Bonus (+50M PlushP = 5K $PLUSH)
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold py-2.5 rounded-2xl text-xs transition-colors"
          >
            Close Window
          </button>
        </div>
      </motion.div>
    </div>
  );
}
