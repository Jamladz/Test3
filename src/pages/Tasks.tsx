import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Youtube, Twitter, Send, CheckCircle2, Video, Coins, UserPlus } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const TASKS = [
  { id: '1', title: 'Play Portals Mini-Game', reward: 150000, icon: Send, color: 'text-[#0088cc]', url: 'https://t.me/portals/market?startapp=29ptrq' },
  { id: '2', title: 'Play Gamee App', reward: 100000, icon: Send, color: 'text-[#0088cc]', url: 'https://t.me/gamee/start?startapp=eyJyZWYiOjEzNjg4OTk4NDJ9' },
  { id: 'ref_1', title: 'Invite 1 Friend', reward: 100000, icon: UserPlus, color: 'text-[#00f3ff]', requiredFriends: 1 },
  { id: 'ref_3', title: 'Invite 3 Friends', reward: 350000, icon: UserPlus, color: 'text-[#00f3ff]', requiredFriends: 3 },
  { id: 'ref_5', title: 'Invite 5 Friends', reward: 750000, icon: UserPlus, color: 'text-[#00f3ff]', requiredFriends: 5 },
];

export function Tasks() {
  const { missions, addBalance, completeMissionApi, userId, username, incrementAdsWatched, friendsCount, adsWatched } = useGameStore();

  const handleTask = async (id: string, reward: number, url?: string, requiredFriends?: number) => {
    if (!missions.includes(id)) {
      if (requiredFriends && friendsCount < requiredFriends) {
        const twa = (window as any).Telegram?.WebApp;
        if (twa?.showAlert) {
          twa.showAlert(`You need ${requiredFriends} friends to complete this task. You currently have ${friendsCount}.`);
        } else {
          alert(`You need ${requiredFriends} friends to complete this task. You currently have ${friendsCount}.`);
        }
        return;
      }

      if (url) {
        const twa = (window as any).Telegram?.WebApp;
        if (twa?.openLink) {
          twa.openLink(url);
        } else {
          window.open(url, '_blank');
        }
        
        // Wait a small delay to feel more realistic before granting
        setTimeout(async () => {
          await completeMissionApi(id, reward);
          if (twa?.HapticFeedback) {
            twa.HapticFeedback.notificationOccurred('success');
          }
        }, 1500);
      } else {
        await completeMissionApi(id, reward);
      }
    }
  };

  const handleWatchAd = () => {
    if (adsWatched >= 5) return;
    const AdController = (window as any).Adsgram?.init({ blockId: "int-16720" });
    if (AdController) {
      AdController.show().then(async (result: any) => {
        incrementAdsWatched(); // Mock local req increment
        await completeMissionApi(`ad_${Date.now()}`, 50000);
      }).catch((result: any) => {});
    } else {
      incrementAdsWatched(); // Mock local req increment
      completeMissionApi(`ad_${Date.now()}`, 50000);
    }
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const dailyMissionId = `daily_${todayDateStr}`;
  const isDailyDone = missions.includes(dailyMissionId);

  const handleDailyReward = async () => {
    if (!isDailyDone) {
      await completeMissionApi(dailyMissionId, 5000);
      const twa = (window as any).Telegram?.WebApp;
      if (twa?.HapticFeedback) {
        twa.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full px-4 pb-6 overflow-y-auto no-scrollbar min-h-0">
      <div className="text-center mb-6 mt-4">
        <div className="mx-auto w-16 h-16 bg-[url('https://i.suar.me/WPjPM/l')] bg-cover mb-4 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.3)]" />
        <h1 className="text-3xl font-bold mb-1">Earn more coins</h1>
      </div>

      <h2 className="font-bold mb-3 text-lg">Daily tasks</h2>
      <button 
        onClick={handleDailyReward} 
        disabled={isDailyDone}
        className={`glass-panel p-4 rounded-2xl flex justify-between items-center mb-4 w-full text-left transition-all ${isDailyDone ? 'opacity-70' : 'active:scale-95 ring-1 ring-[#FFD700]/30 hover:bg-white/5'}`}
      >
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">📅</div>
            <div>
              <h3 className="font-bold text-sm">Daily reward</h3>
              <p className="text-xs text-[#FFD700]">
                {isDailyDone ? 'Come back tomorrow' : '+5,000 Coins'}
              </p>
            </div>
         </div>
      </button>

      <button onClick={handleWatchAd} disabled={adsWatched >= 5} className={`glass-panel p-4 rounded-2xl flex items-center justify-between mb-8 w-full text-left transition-transform ${adsWatched >= 5 ? 'opacity-50' : 'active:scale-95 ring-1 ring-[#00f3ff]/30 shadow-[0_4px_20px_rgba(0,243,255,0.15)]'}`}>
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00f3ff]/20 to-blue-600/20 rounded-xl flex items-center justify-center text-[#00f3ff]">
               <Video size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base">Watch Video Ad</h3>
              <div className="flex items-center gap-1.5 text-[#FFD700] font-mono text-sm mt-0.5">
                  <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-[14px] h-[14px] object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                  <span>+50,000</span>
              </div>
            </div>
         </div>
         <div className="text-xs font-bold text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">
           {adsWatched}/5
         </div>
      </button>

      <h2 className="font-bold mb-3 text-lg">Tasks list</h2>
      <div className="space-y-3">
        {TASKS.map(task => {
          const Icon = task.icon;
          const isDone = missions.includes(task.id);
          return (
            <button
              key={task.id}
              onClick={() => handleTask(task.id, task.reward, task.url, task.requiredFriends)}
              disabled={isDone}
              className={`w-full glass-panel p-4 rounded-2xl flex items-center justify-between transition-all px-4 ${isDone ? 'opacity-50' : 'active:scale-95 ring-1 ring-white/5 hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                   <Icon size={24} className={task.color} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm mb-1">{task.title}</h3>
                  <div className="flex items-center gap-1.5 text-[#FFD700] font-mono text-xs">
                    <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-[12px] h-[12px] object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                    <span>+{formatCurrency(task.reward)}</span>
                  </div>
                </div>
              </div>
              
              {isDone ? (
                <CheckCircle2 className="text-[#00f3ff]" size={24} />
              ) : (
                <div className="px-5 py-2 bg-white/10 rounded-full text-xs font-bold text-white shadow-inner">Start</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
}
