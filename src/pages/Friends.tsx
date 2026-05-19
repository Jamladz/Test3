import React from 'react';
import { Gift, Copy, UserPlus, Coins } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';

export function Friends() {
  const { friendsCount, userId } = useGameStore();

  const getInviteLink = () => `https://t.me/PlushTap_bot?start=ref${userId}`;

  const handleInvite = () => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa) {
      twa.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(getInviteLink())}&text=${encodeURIComponent('Join me and get 50,000 Pepe coins as a welcome bonus!')}`);
    } else {
      navigator.clipboard.writeText(getInviteLink());
      alert("Invite link copied to clipboard: " + getInviteLink());
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getInviteLink());
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) twa.HapticFeedback.notificationOccurred('success');
  };

  return (
    <div className="flex flex-col flex-1 w-full px-4 pb-20 overflow-y-auto no-scrollbar relative min-h-0">
      <div className="text-center mb-6 mt-4 shrink-0">
        <h1 className="text-3xl font-bold mb-2">Invite Friends!</h1>
        <p className="text-gray-400 text-sm">You and your friend will receive huge bonuses</p>
      </div>

      <div className="space-y-4 mb-8 shrink-0">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-[#FFD700]/10 shadow-[0_4px_20px_rgba(255,215,0,0.05)]">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E6C200] flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]">
             <Gift size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1 text-white">Invite a friend</h3>
            <div className="flex items-center gap-1.5 text-[#FFD700] font-mono text-xs">
              <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-3.5 h-3.5 object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
              <span className="font-bold">+100k for you, +50k for friend</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="font-bold text-lg leading-none">Your friends</h2>
        <span className="text-gray-400 text-sm font-medium">{friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}</span>
      </div>
      
      {friendsCount === 0 ? (
        <div className="glass-panel p-10 rounded-[1.5rem] text-center mb-8 bg-white/5 border border-white/5 shadow-inner shrink-0">
          <p className="text-gray-400 font-medium text-sm">You haven't invited anyone yet</p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-[1.5rem] mb-8 bg-white/5 border border-[#FFD700]/20 shadow-inner shrink-0 flex items-center justify-center gap-3">
          <UserPlus className="text-[#FFD700]" size={24} />
          <span className="text-lg font-bold">You invited {friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}!</span>
        </div>
      )}

      <div className="mt-auto sticky bottom-0 left-0 right-0 py-4 z-40 max-w-md mx-auto flex gap-3 bg-[#000000]/80 backdrop-blur-md">
        <button 
          onClick={handleInvite}
          className="flex-1 bg-gradient-to-r from-[#00f3ff] to-blue-500 hover:from-blue-400 hover:to-blue-600 text-black font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all active:scale-95 flex justify-center items-center gap-2"
        >
          <UserPlus size={24} />
          Invite a friend
        </button>
        <button 
          onClick={handleCopy}
          className="w-16 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl flex justify-center items-center backdrop-blur-md transition-all active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-white/10"
        >
          <Copy size={24} />
        </button>
      </div>
    </div>
  );
}
