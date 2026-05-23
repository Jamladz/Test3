import React, { useEffect, useState } from 'react';
import { Gift, Copy, UserPlus, Coins, User } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../lib/utils';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ReferralDoc {
  userId: string;
  firstName: string;
  username: string;
  createdAt: any;
}

export function Friends() {
  const { friendsCount, userId } = useGameStore();
  const [friendsList, setFriendsList] = useState<ReferralDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getInviteLink = () => `https://t.me/PlushTap_bot?startapp=ref${userId}`;

  useEffect(() => {
    if (!userId) return;
    
    const fetchFriends = async () => {
      try {
        const q = query(
          collection(db, 'referrals'),
          where('referrerTelegramId', '==', userId.toString())
        );
        const querySnapshot = await getDocs(q);
        const friends: ReferralDoc[] = [];
        querySnapshot.forEach((doc) => {
          friends.push(doc.data() as ReferralDoc);
        });
        
        // Sort manually by date if available
        friends.sort((a, b) => {
           const timeA = a.createdAt?.seconds || 0;
           const timeB = b.createdAt?.seconds || 0;
           return timeB - timeA;
        });

        setFriendsList(friends);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [firebaseUid]);

  const displayCount = isLoading ? friendsCount : friendsList.length;

  const handleInvite = () => {
    const twa = (window as any).Telegram?.WebApp;
    const shortLink = getInviteLink();
    const text = encodeURIComponent('Join me and get 60,000 Pepe coins as a welcome bonus!');
    
    if (twa) {
      twa.openTelegramLink(`https://t.me/share/url?url=${shortLink}&text=${text}`);
    } else {
      navigator.clipboard.writeText(shortLink);
      alert("Invite link copied to clipboard: " + shortLink);
    }
  };

  const handleCopy = () => {
    const shortLink = getInviteLink();
    navigator.clipboard.writeText(shortLink);
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
              <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-3.5 h-3.5 object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
              <span className="font-bold">+100k for you, +60k for friend</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="font-bold text-lg leading-none">Your friends</h2>
        <span className="text-gray-400 text-sm font-medium">{displayCount} {displayCount === 1 ? 'friend' : 'friends'}</span>
      </div>
      
      {isLoading ? (
        <div className="glass-panel p-10 rounded-[1.5rem] text-center mb-8 bg-white/5 border border-white/5 shadow-inner shrink-0 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#00f3ff] border-t-transparent animate-spin" />
        </div>
      ) : friendsList.length === 0 ? (
        <div className="glass-panel p-10 rounded-[1.5rem] text-center mb-8 bg-white/5 border border-white/5 shadow-inner shrink-0">
          <p className="text-gray-400 font-medium text-sm">You haven't invited anyone yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8 shrink-0">
          {friendsList.map((friend, idx) => (
             <div key={idx} className="glass-panel p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1c1c1e] to-[#2a2a2d] border border-white/10 flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-white font-bold text-sm">
                       {friend.firstName || friend.username || 'Anonymous User'}
                     </span>
                     {friend.username && (
                       <span className="text-gray-400 text-xs mt-0.5">@{friend.username}</span>
                     )}
                  </div>
                </div>
                
                <div className="text-[#FFD700] font-mono text-sm font-bold flex items-center gap-1">
                  <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-3.5 h-3.5 object-contain" />
                  +100k
                </div>
             </div>
          ))}
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
