import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { Lock, Coins, Timer } from 'lucide-react';

const UPGRADES = [
  // Gifts
  { id: '100', category: 'gifts', name: 'Plush Pepe', description: 'Cute Pepe Plushie', baseCost: 500, baseProfit: 200, isImage: true, icon: 'https://i.suar.me/Lpxpo/l' },
  { id: '101', category: 'gifts', name: 'Scared Cat', description: 'Very scared cat', baseCost: 1500, baseProfit: 600, isImage: true, icon: 'https://i.suar.me/2zGz9/l' },
  { id: '102', category: 'gifts', name: 'Heart Locket', description: 'A lovely locket', baseCost: 5000, baseProfit: 2000, isImage: true, icon: 'https://i.suar.me/a9M9l/l' },
  { id: '103', category: 'gifts', name: 'Low Rider', description: 'Low Rider car', baseCost: 10000, baseProfit: 3500, isImage: true, icon: 'https://i.suar.me/zX418/l' },
  { id: '104', category: 'gifts', name: 'Jooly Chimp', description: 'Jooly Chimp toy', baseCost: 25000, baseProfit: 9000, isImage: true, icon: 'https://i.suar.me/Jprpg/l' },
  { id: '105', category: 'gifts', name: 'Voodoo Doll', description: 'Voodoo Doll', baseCost: 50000, baseProfit: 18000, isImage: true, icon: 'https://i.suar.me/YQ3Q7/l' },
  { id: '106', category: 'gifts', name: 'Toy Bear', description: 'Toy Bear', baseCost: 80000, baseProfit: 28000, isImage: true, icon: 'https://i.suar.me/MpLp9/l' },
  { id: '107', category: 'gifts', name: 'Snoop Cigar', description: 'Snoop Cigar', baseCost: 120000, baseProfit: 45000, isImage: true, icon: 'https://i.suar.me/9zPzB/l' },
  { id: '108', category: 'gifts', name: 'Lonic Dryer', description: 'Ionic Hair Dryer', baseCost: 200000, baseProfit: 75000, isImage: true, icon: 'https://i.suar.me/V9d9g/l' },
  { id: '109', category: 'gifts', name: 'Signet Ring', description: 'Signet Ring', baseCost: 350000, baseProfit: 140000, isImage: true, icon: 'https://i.suar.me/wzAz6/l' },

  // Markets
  { id: '1', category: 'markets', name: 'Social Media', description: 'Boost your reach', baseCost: 100, baseProfit: 50, icon: '📱' },
  { id: '2', category: 'markets', name: 'Influencer', description: 'Massive visibility', baseCost: 500, baseProfit: 300, icon: '🌟' },
  { id: '5', category: 'markets', name: 'Launchpad', description: 'Access to IDO', baseCost: 50000, baseProfit: 20000, icon: '🚀' },
  { id: '11', category: 'markets', name: 'YouTube Channel', description: 'Create video content', baseCost: 2000, baseProfit: 850, icon: '📺' },
  { id: '12', category: 'markets', name: 'TikTok Viral', description: 'Go viral on TikTok', baseCost: 15000, baseProfit: 6000, icon: '🎵' },
  { id: '13', category: 'markets', name: 'Billboard Ads', description: 'Ads in Times Square', baseCost: 45000, baseProfit: 15000, icon: '🪧' },
  { id: '14', category: 'markets', name: 'Super Bowl Ad', description: 'Global domination', baseCost: 250000, baseProfit: 100000, icon: '🏈' },
  { id: '21', category: 'markets', name: 'Podcast Sponsor', description: 'Sponsor top crypto podcasts', baseCost: 85000, baseProfit: 34000, icon: '🎙️' },
  { id: '22', category: 'markets', name: 'Metaverse Land', description: 'Open a virtual office', baseCost: 120000, baseProfit: 50000, icon: '👓' },
  { id: '23', category: 'markets', name: 'Crypto Event Sponsor', description: 'Token2049 Main Sponsor', baseCost: 400000, baseProfit: 180000, icon: '🎪' },
  { id: '24', category: 'markets', name: 'AI Marketing Agent', description: 'Req: 20 Ads Watched', baseCost: 35000, baseProfit: 45000, icon: '🤖', reqAds: 20 },
  
  // PR & Team
  { id: '3', category: 'pr', name: 'PR Agency', description: 'Professional PR', baseCost: 2500, baseProfit: 1200, icon: '📰' },
  { id: '4', category: 'pr', name: 'Exchange Collab', description: 'Tier 1 prep', baseCost: 10000, baseProfit: 5000, icon: '🤝' },
  { id: '6', category: 'pr', name: 'Web3 Devs', description: 'Top tier devs', baseCost: 100000, baseProfit: 45000, icon: '🎮' },
  { id: '7', category: 'pr', name: 'Global Network', description: 'Req: 5 Friends', baseCost: 80000, baseProfit: 30000, icon: '🌍', reqFriends: 5 },
  { id: '15', category: 'pr', name: 'Support Team', description: '24/7 Support', baseCost: 6000, baseProfit: 2000, icon: '🎧' },
  { id: '16', category: 'pr', name: 'CTO Hire', description: 'Technical leadership', baseCost: 150000, baseProfit: 60000, icon: '👔' },
  { id: '17', category: 'pr', name: 'Community Manager', description: 'Req: 3 Friends', baseCost: 35000, baseProfit: 12000, icon: '🛡️', reqFriends: 3 },
  { id: '25', category: 'pr', name: 'Security Auditors', description: 'Certik audit complete', baseCost: 220000, baseProfit: 85000, icon: '🔐' },
  { id: '26', category: 'pr', name: 'Growth Hacker', description: 'Viral mechanics', baseCost: 65000, baseProfit: 27000, icon: '📈' },
  { id: '27', category: 'pr', name: 'Elite Advisory Board', description: 'Req: 10 Friends', baseCost: 500000, baseProfit: 250000, icon: '🧠', reqFriends: 10 },
  
  // Legal
  { id: '8', category: 'legal', name: 'USA License', description: 'Legal entry to US', baseCost: 20000, baseProfit: 8000, icon: '📜' },
  { id: '9', category: 'legal', name: 'Dubai HQ', description: '0% Crypto Taxes', baseCost: 75000, baseProfit: 35000, icon: '🏙️' },
  { id: '10', category: 'legal', name: 'Ads Premium', description: 'Req: 10 Ads Watched', baseCost: 5000, baseProfit: 25000, icon: '📺', reqAds: 10 },
  { id: '18', category: 'legal', name: 'EU Regulation', description: 'MiCA Compliance', baseCost: 40000, baseProfit: 16000, icon: '🇪🇺' },
  { id: '19', category: 'legal', name: 'KYC Provider', description: 'Secure onboarding', baseCost: 12000, baseProfit: 4000, icon: '🆔' },
  { id: '20', category: 'legal', name: 'Legal Counsel', description: 'Retain top lawyers', baseCost: 200000, baseProfit: 85000, icon: '⚖️' },
  { id: '28', category: 'legal', name: 'Offshore Entity', description: 'Cayman Islands Setup', baseCost: 95000, baseProfit: 42000, icon: '🏝️' },
  { id: '29', category: 'legal', name: 'Patent Portfolio', description: 'Protect IP', baseCost: 180000, baseProfit: 75000, icon: '™️' },
  { id: '30', category: 'legal', name: 'Tax Optimisation', description: 'Req: 50 Ads Watched', baseCost: 100000, baseProfit: 120000, icon: '💰', reqAds: 50 },
];

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const m2 = m % 60;
  return `${h}h ${m2}m`;
}

export function Mine() {
  const { balance, upgrades, cooldowns, setCooldown, friendsCount, adsWatched, buyUpgradeApi } = useGameStore();
  const [activeTab, setActiveTab] = useState<'gifts'|'markets'|'pr'|'legal'>('gifts');
  const [now, setNow] = useState(Date.now());
  const [lockedPopup, setLockedPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = async (upgradeId: string) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const level = upgrades[upgradeId] || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, level));
    const profitInc = Math.floor(upgrade.baseProfit * Math.pow(1.2, level));

    if (balance < cost) return;

    // Base 5 seconds, max 24 hours per level
    const cooldownTime = Date.now() + Math.min(5000 * Math.pow(1.5, level), 86400000);
    setCooldown(upgradeId, cooldownTime);
    
    await buyUpgradeApi(upgradeId, cost, profitInc);
    
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.HapticFeedback) {
      twa.HapticFeedback.notificationOccurred('success');
    }
  };

  const filteredUpgrades = UPGRADES.filter(u => u.category === activeTab);

  return (
    <div className="flex flex-col flex-1 w-full px-4 pb-20 overflow-y-auto no-scrollbar min-h-0 relative">
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#000000] via-[#000000] to-transparent pt-2 pb-4 -mx-4 px-4 w-[calc(100%+2rem)]">
        <div className="flex bg-[#1c1c1e]/90 backdrop-blur-md p-1.5 rounded-2xl relative border border-white/10 overflow-x-auto no-scrollbar shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setActiveTab('gifts')}
            className={`shrink-0 min-w-[80px] flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'gifts' ? 'bg-gradient-to-b from-[#FFD700] to-[#ccac00] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Gifts
          </button>
          <button 
            onClick={() => setActiveTab('markets')}
            className={`shrink-0 min-w-[80px] flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'markets' ? 'bg-gradient-to-b from-[#FFD700] to-[#ccac00] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Markets
          </button>
          <button 
            onClick={() => setActiveTab('pr')}
            className={`shrink-0 min-w-[90px] flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'pr' ? 'bg-gradient-to-b from-[#FFD700] to-[#ccac00] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            PR & Team
          </button>
          <button 
            onClick={() => setActiveTab('legal')}
            className={`shrink-0 min-w-[80px] flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'legal' ? 'bg-gradient-to-b from-[#FFD700] to-[#ccac00] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Legal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredUpgrades.map(upgrade => {
          const level = upgrades[upgrade.id] || 0;
          const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, level));
          const profit = Math.floor(upgrade.baseProfit * Math.pow(1.2, level));
          
          let canAfford = balance >= cost;
          let isLocked = false;
          let lockMessage = '';

          if (upgrade.reqFriends && friendsCount < upgrade.reqFriends) {
            isLocked = true;
            lockMessage = `Req: ${upgrade.reqFriends} Friends (${friendsCount}/${upgrade.reqFriends})`;
          }
          if (upgrade.reqAds && adsWatched < upgrade.reqAds) {
            isLocked = true;
            lockMessage = `Req: ${upgrade.reqAds} Ads (${adsWatched}/${upgrade.reqAds})`;
          }

          const cooldownEnd = cooldowns[upgrade.id] || 0;
          const isOnCooldown = now < cooldownEnd;
          const cooldownLeft = Math.max(0, cooldownEnd - now);
          
          const disabled = !canAfford || isLocked || isOnCooldown;

          const handleClick = () => {
             if (isLocked) {
               const twa = (window as any).Telegram?.WebApp;
               if (twa?.showAlert) {
                 twa.showAlert(`To unlock this card:\n\n${lockMessage}`);
               } else {
                 setLockedPopup({show: true, message: lockMessage});
               }
               return;
             }
             if (!disabled) {
               handleBuy(upgrade.id);
             }
          };

          return (
            <button
               key={upgrade.id}
               onClick={handleClick}
               disabled={!isLocked && disabled} // Allow clicking if locked
               className={`glass-panel p-4 rounded-[1.25rem] flex flex-col relative overflow-hidden transition-all ${disabled ? (isLocked ? 'opacity-80 ring-1 ring-red-500/20 bg-red-500/5 cursor-pointer' : 'opacity-60 ring-1 ring-white/5') : 'active:scale-95 ring-1 ring-[#00f3ff]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'}`}
             >
               <div className="flex items-start w-full gap-2 mb-3 relative z-10 flex-1">
                 <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2a2a2d] to-[#1c1c1e] flex items-center justify-center text-2xl flex-shrink-0 shadow-inner border border-white/5 ${isLocked && 'filter grayscale opacity-50'}`}>
                   {upgrade.isImage ? (
                     <img src={upgrade.icon} alt={upgrade.name} className="w-[85%] h-[85%] object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                   ) : (
                     <>{upgrade.icon}</>
                   )}
                 </div>
                 <div className="text-left flex-1 min-h-[50px] flex flex-col justify-start mt-0.5">
                   <h3 className="text-white text-[13px] font-bold leading-tight line-clamp-2 mb-1">{upgrade.name}</h3>
                   {isLocked ? (
                     <div className="text-red-400 text-[10px] uppercase font-bold tracking-tight leading-[1.1]">{lockMessage}</div>
                   ) : (
                     <div className="flex flex-col gap-0.5">
                       <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Profit/h</div>
                       <div className="flex items-center gap-1 text-[#FFD700] font-mono text-[11px] font-bold leading-[1]">
                          <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-[10px] h-[10px] object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                          +{formatNumber(profit)}
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               <div className="flex items-center justify-between w-full mt-auto relative z-10 shrink-0 bg-black/20 p-2.5 rounded-xl border border-white/5">
                 <span className="text-gray-400 text-[11px] font-bold tracking-wider">LVL {level}</span>
                 {isOnCooldown ? (
                   <div className="flex items-center gap-1.5 text-[#00f3ff] font-mono font-bold text-xs bg-[#00f3ff]/10 px-2 py-1 rounded-md">
                     <Timer size={12} />
                     {formatTime(cooldownLeft)}
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 text-white font-mono font-bold text-sm bg-black/30 px-2.5 py-1 rounded-md border border-white/5 shadow-inner">
                      <div className={`w-4 h-4 flex items-center justify-center ${canAfford && !isLocked ? 'drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : 'opacity-50 grayscale'}`}>
                        <img src="https://i.suar.me/dgMM9/l" alt="Coin" className="w-full h-full object-contain" />
                      </div>
                      <span className={!canAfford && !isLocked ? 'text-gray-500' : 'text-[#FFD700]'}>{formatNumber(cost)}</span>
                   </div>
                 )}
               </div>

               {isLocked && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                   <div className="bg-red-500/20 p-2 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                     <Lock size={20} className="text-red-400" />
                   </div>
                 </div>
               )}
               {isOnCooldown && !isLocked && (
                 <div className="absolute inset-0 bg-black/60 rounded-[1.25rem] z-0 overflow-hidden pointer-events-none">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-[#00f3ff]/10 transition-all ease-linear"
                      style={{ 
                        height: `${(cooldownLeft / Math.min(5000 * Math.pow(1.5, level), 86400000)) * 100}%` 
                      }}
                    />
                 </div>
               )}
             </button>
           )
         })}
       </div>

       {lockedPopup.show && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
               <Lock size={32} className="text-red-400" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Card Locked</h2>
             <p className="text-gray-400 mb-6 text-sm">{lockedPopup.message}</p>
             <button 
               onClick={() => setLockedPopup({show: false, message: ''})}
               className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
             >
               Understand
             </button>
           </div>
         </div>
       )}
    </div>
  );
}
