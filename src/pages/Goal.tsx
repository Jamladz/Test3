import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, CheckCircle2, PlayCircle, Loader2, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { AdSequenceOverlay } from '../components/AdSequenceOverlay';

// Admin can add match using the Admin panel.
export function Goal({ onClose }: { onClose?: () => void }) {
  const { matches, predictions, predictMatch, collectMatchReward, balance } = useGameStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'A'|'B'|'draw' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'finished'>('active');

  const startAdSequence = (blockId: string, onReward: () => void) => {
     setActiveAdId(blockId);
     const checkCompletion = () => {
        if ((window as any)._adSequenceCompleted) {
           (window as any)._adSequenceCompleted = false;
           setActiveAdId(null);
           onReward();
        } else if (activeAdId !== null) {
           setTimeout(checkCompletion, 1000);
        }
     };
     setTimeout(checkCompletion, 1000);
  };

  const handlePredict = async (matchId: string) => {
    if (!selectedTeam || isProcessing || balance < betAmount) return;
    
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) twa.HapticFeedback.impactOccurred('medium');

    setIsProcessing(true);
    await predictMatch(matchId, selectedTeam, betAmount);
    setIsProcessing(false);
    setSelectedMatch(null);
    setSelectedTeam(null);
    
    if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
  };

  const handleCollect = (matchId: string, winAmount: number) => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) twa.HapticFeedback.impactOccurred('medium');
    
    startAdSequence('int-35086', async () => {
       setIsProcessing(true);
       await collectMatchReward(matchId, winAmount);
       setIsProcessing(false);
       if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
    });
  };

  const getMatchDisplayStatus = (m: any) => {
    if (m.status === 'completed') return 'completed';
    if (!m.timestamp) return m.status;
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    if (now >= m.timestamp + twoHours) return 'completed_pending_result';
    if (now >= m.timestamp) return 'live';
    return m.status; // defaults to 'upcoming' if not yet reached
  };

  const activeMatches = matches.filter(m => getMatchDisplayStatus(m) !== 'completed' && getMatchDisplayStatus(m) !== 'completed_pending_result');
  const finishedMatches = matches.filter(m => getMatchDisplayStatus(m) === 'completed' || getMatchDisplayStatus(m) === 'completed_pending_result');

  const renderMatch = (match: any) => {
    const displayStatus = getMatchDisplayStatus(match);
    const pred = predictions[match.id];
    // We only consider it a win if the match is officially 'completed' with a winner
    const isWin = pred && match.status === 'completed' && match.winner === pred.choice;
    const isLoss = pred && match.status === 'completed' && match.winner && match.winner !== pred.choice;
    const canCollect = isWin && !pred.collected;
    const winAmount = pred ? pred.betAmount * 2 : 0; // Simple 2x multiplier 

    return (
      <div key={match.id} className="bg-[#151518] rounded-xl p-3 border border-white/5 relative overflow-hidden shadow-lg">
        {displayStatus === 'live' && (
           <div className="absolute top-0 right-0 left-0 h-[2px] bg-red-500 animate-pulse" />
        )}
        <div className="flex justify-between items-center mb-3 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-1 rounded">
            {match.day} {match.month} • {match.matchTime}
          </span>
          {displayStatus === 'live' ? (
            <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded animate-pulse inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              LIVE
            </span>
          ) : displayStatus === 'upcoming' ? (
            <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded">
              UPCOMING
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-1 rounded">
              FINISHED
            </span>
          )}
        </div>

        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex flex-col items-center gap-1.5 flex-[2]">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 p-1.5 relative overflow-hidden">
               <img src={match.teamA.image} alt={match.teamA.name} className="w-full h-full object-contain" />
               {match.winner === 'A' && <div className="absolute inset-0 bg-green-500/20 shadow-[inset_0_0_10px_rgba(34,197,94,0.5)]" />}
            </div>
            <span className="font-bold text-xs text-center line-clamp-1">{match.teamA.name}</span>
          </div>

          <div className="flex flex-col items-center px-1 flex-1 justify-center relative">
             <div className="flex items-center gap-1.5 mb-1">
               <span className="text-lg font-bold bg-white/10 px-2 py-0.5 rounded text-white">{match.teamA.score ?? 0}</span>
               <span className="text-xs font-bold text-gray-500">-</span>
               <span className="text-lg font-bold bg-white/10 px-2 py-0.5 rounded text-white">{match.teamB.score ?? 0}</span>
             </div>
             <div className="font-black text-[10px] text-white/20 italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10 text-2xl">VS</div>
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-[2]">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 p-1.5 relative overflow-hidden">
               <img src={match.teamB.image} alt={match.teamB.name} className="w-full h-full object-contain" />
               {match.winner === 'B' && <div className="absolute inset-0 bg-green-500/20 shadow-[inset_0_0_10px_rgba(34,197,94,0.5)]" />}
            </div>
            <span className="font-bold text-xs text-center line-clamp-1">{match.teamB.name}</span>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 mt-1">
          {pred ? (
            <div className="flex flex-col items-center justify-center p-2 bg-black/20 rounded-lg border border-white/5">
              <div className="text-[10px] text-gray-400 mb-0.5">Your Prediction</div>
              <div className="font-bold text-white text-sm">
                 {pred.choice === 'A' ? match.teamA.name : pred.choice === 'B' ? match.teamB.name : 'Draw'}
              </div>
              <div className="text-[10px] font-mono mt-0.5 text-[#FFD700] flex items-center gap-1">
                 Bet: {pred.betAmount} <Coins size={8} />
              </div>

              {canCollect && (
                 <button 
                   onClick={() => handleCollect(match.id, winAmount)}
                   disabled={isProcessing}
                   className="mt-2 w-full py-1.5 rounded bg-green-500 hover:bg-green-400 text-black font-bold active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                 >
                   <PlayCircle size={14} /> Collect {winAmount} <Coins size={12} />
                 </button>
              )}
              {pred.collected && (
                 <div className="mt-2 w-full py-1.5 text-center rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20 text-[10px] flex items-center justify-center gap-1 uppercase">
                   <CheckCircle2 size={12} /> Claimed {winAmount}
                 </div>
              )}
              {isLoss && (
                 <div className="mt-2 w-full py-1.5 text-center rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-[10px] uppercase tracking-wider">
                   Incorrect Prediction
                 </div>
              )}
              {displayStatus === 'live' && !match.winner && (
                 <div className="mt-2 text-[10px] text-yellow-400 font-bold animate-pulse">Match in progress...</div>
              )}
              {displayStatus === 'completed_pending_result' && !match.winner && (
                 <div className="mt-2 text-[10px] text-gray-400 italic">Awaiting final results...</div>
              )}
              {displayStatus === 'upcoming' && (
                 <div className="mt-2 text-[10px] text-gray-500 italic">Awaiting match start...</div>
              )}
            </div>
          ) : displayStatus === 'upcoming' ? (
            selectedMatch === match.id ? (
              <div className="space-y-2.5 animation-fade-in">
                <h4 className="text-center font-bold text-xs">Choose Winner</h4>
                <div className="flex gap-2">
                   <button onClick={() => setSelectedTeam('A')} className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${selectedTeam === 'A' ? 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                     {match.teamA.name}
                   </button>
                   <button onClick={() => setSelectedTeam('draw')} className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${selectedTeam === 'draw' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                     Draw
                   </button>
                   <button onClick={() => setSelectedTeam('B')} className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${selectedTeam === 'B' ? 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                     {match.teamB.name}
                   </button>
                </div>
                
                <div className="flex justify-between items-center gap-2">
                   <div className="flex-1">
                     <input 
                       type="number" 
                       value={betAmount} 
                       onChange={e => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                       placeholder="Amount" 
                       className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#00f3ff]"
                     />
                   </div>
                   <button 
                     onClick={() => handlePredict(match.id)}
                     disabled={!selectedTeam || isProcessing || balance < betAmount}
                     className="flex-[2] py-1.5 rounded bg-[#00f3ff] text-black font-bold active:scale-95 transition-all text-xs shadow-[0_0_10px_rgba(0,243,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                   >
                     {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <>Confirm</>}
                   </button>
                </div>
                <div className="text-center text-[10px] text-gray-500">
                   Cost: <span className={balance < betAmount ? 'text-red-400' : 'text-gray-300'}>{betAmount}</span> coins • Win: {betAmount * 2}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setSelectedMatch(match.id); setSelectedTeam(null); setBetAmount(100); }}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 font-bold active:scale-95 transition-all hover:bg-green-500/30 flex items-center justify-center gap-1.5 text-xs shadow-[0_0_15px_rgba(34,197,94,0.1)]"
              >
                Place Prediction
              </button>
            )
          ) : (
             <div className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 font-bold text-center text-xs uppercase tracking-wider">
               Betting Closed
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-full h-full bg-[#0a0a0c] text-white overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Fixed Sticky Header Section */}
      <div className="flex-none pt-safe-top z-20 relative px-4 pt-4 pb-4 bg-black/40 backdrop-blur-md border-b border-white/5">
        <header className="mb-4 relative">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Trophy className="text-green-400" size={28} />
              Goal Predict
            </h1>
            {onClose && (
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-400">Predict match outcomes and win coins!</p>
        </header>

        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5 relative z-10 w-full max-w-md mx-auto shadow-inner">
          <button 
            onClick={() => {
               const twa = (window as any).Telegram?.WebApp;
               if (twa?.HapticFeedback) twa.HapticFeedback.impactOccurred('light');
               setViewMode('active');
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === 'active' ? 'bg-gradient-to-r from-green-500/20 to-[#00f3ff]/20 text-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.15)] border border-[#00f3ff]/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
          >
            <span className={`w-2 h-2 rounded-full transition-all ${viewMode === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            Active matches
          </button>
          <button 
            onClick={() => {
               const twa = (window as any).Telegram?.WebApp;
               if (twa?.HapticFeedback) twa.HapticFeedback.impactOccurred('light');
               setViewMode('finished');
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === 'finished' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
          >
            Finished
          </button>
        </div>
      </div>
      
      {/* Scrollable List Section */}
      <div className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-24 custom-scroll relative z-10">
        
        {matches.length === 0 ? (
          <div className="text-center text-gray-500 py-12 flex flex-col items-center">
             <Trophy className="opacity-20 mb-4" size={48} />
             <p className="text-lg font-bold">No Matches Available</p>
             <p className="text-sm">Check back later for new matches!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-12 min-h-[300px]">
            {viewMode === 'active' ? (
              activeMatches.length > 0 ? (
                <div className="space-y-4 animation-fade-in">
                  {activeMatches.map(renderMatch)}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center animation-fade-in">
                   <p className="text-sm">No active matches at the moment.</p>
                </div>
              )
            ) : (
              finishedMatches.length > 0 ? (
                <div className="space-y-4 opacity-80 animation-fade-in">
                  {finishedMatches.map(renderMatch)}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12 flex flex-col items-center animation-fade-in">
                   <p className="text-sm">No finished matches yet.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
      
      {activeAdId && <AdSequenceOverlay blockId={activeAdId} rewardAmount={0} isGameAd={true} />}
    </div>
  );
}
