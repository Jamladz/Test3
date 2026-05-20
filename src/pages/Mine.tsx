import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { Lock, Coins, Timer } from 'lucide-react';

const UPGRADES = [
  // Gifts
  { id: '100', category: 'gifts', name: 'Plush Pepe', description: 'Cute Pepe Plushie', baseCost: 500, baseProfit: 200, isImage: true, icon: 'https://i.suar.me/Lpxpo/l' },
  { id: '101', category: 'gifts', name: 'Scared Cat', description: 'Req: Plush Pepe lvl 2', baseCost: 1500, baseProfit: 600, isImage: true, icon: 'https://i.suar.me/2zGz9/l', reqUpgrade: '100', reqLevel: 2 },
  { id: '102', category: 'gifts', name: 'Heart Locket', description: 'Req: Scared Cat lvl 3', baseCost: 5000, baseProfit: 2000, isImage: true, icon: 'https://i.suar.me/a9M9l/l', reqUpgrade: '101', reqLevel: 3 },
  { id: '103', category: 'gifts', name: 'Low Rider', description: 'Req: Heart Locket lvl 4', baseCost: 10000, baseProfit: 3500, isImage: true, icon: 'https://i.suar.me/zX418/l', reqUpgrade: '102', reqLevel: 4 },
  { id: '104', category: 'gifts', name: 'Jooly Chimp', description: 'Req: Low Rider lvl 5', baseCost: 25000, baseProfit: 9000, isImage: true, icon: 'https://i.suar.me/Jprpg/l', reqUpgrade: '103', reqLevel: 5 },
  { id: '105', category: 'gifts', name: 'Voodoo Doll', description: 'Req: Jooly Chimp lvl 6', baseCost: 50000, baseProfit: 18000, isImage: true, icon: 'https://i.suar.me/YQ3Q7/l', reqUpgrade: '104', reqLevel: 6 },
  { id: '106', category: 'gifts', name: 'Toy Bear', description: 'Req: Voodoo Doll lvl 7', baseCost: 80000, baseProfit: 28000, isImage: true, icon: 'https://i.suar.me/MpLp9/l', reqUpgrade: '105', reqLevel: 7 },
  { id: '107', category: 'gifts', name: 'Snoop Cigar', description: 'Req: Toy Bear lvl 8', baseCost: 120000, baseProfit: 45000, isImage: true, icon: 'https://i.suar.me/9zPzB/l', reqUpgrade: '106', reqLevel: 8 },
  { id: '108', category: 'gifts', name: 'Lonic Dryer', description: 'Req: Snoop Cigar lvl 9', baseCost: 200000, baseProfit: 75000, isImage: true, icon: 'https://i.suar.me/V9d9g/l', reqUpgrade: '107', reqLevel: 9 },
  { id: '109', category: 'gifts', name: 'Signet Ring', description: 'Req: Lonic Dryer lvl 10', baseCost: 350000, baseProfit: 140000, isImage: true, icon: 'https://i.suar.me/wzAz6/l', reqUpgrade: '108', reqLevel: 10 },

  // Exchanges
  { id: '1', category: 'markets', name: 'Binance', description: 'Tier 1 Centralized Exchange', baseCost: 500, baseProfit: 250, icon: '🔶' },
  { id: '11', category: 'markets', name: 'Bybit', description: 'Req: Binance lvl 2', baseCost: 2000, baseProfit: 850, icon: '📈', reqUpgrade: '1', reqLevel: 2 },
  { id: '2', category: 'markets', name: 'OKX', description: 'Req: Bybit lvl 3', baseCost: 5000, baseProfit: 3000, icon: '🌐', reqUpgrade: '11', reqLevel: 3 },
  { id: '12', category: 'markets', name: 'HTX', description: 'Req: OKX lvl 4', baseCost: 15000, baseProfit: 6000, icon: '🔥', reqUpgrade: '2', reqLevel: 4 },
  { id: '13', category: 'markets', name: 'KuCoin', description: 'Req: HTX lvl 5', baseCost: 45000, baseProfit: 15000, icon: '🏦', reqUpgrade: '12', reqLevel: 5 },
  { id: '21', category: 'markets', name: 'MEXC', description: 'Req: KuCoin lvl 6', baseCost: 85000, baseProfit: 34000, icon: '📊', reqUpgrade: '13', reqLevel: 6 },
  { id: '5', category: 'markets', name: 'Uniswap (DEX)', description: 'Req: MEXC lvl 7', baseCost: 150000, baseProfit: 60000, icon: '🦄', reqUpgrade: '21', reqLevel: 7 },
  { id: '22', category: 'markets', name: 'PancakeSwap (DEX)', description: 'Req: Uniswap lvl 8', baseCost: 250000, baseProfit: 100000, icon: '🥞', reqUpgrade: '5', reqLevel: 8 },
  { id: '14', category: 'markets', name: 'STON.fi (TON DEX)', description: 'Req: PancakeSwap lvl 9', baseCost: 500000, baseProfit: 200000, icon: '💎', reqUpgrade: '22', reqLevel: 9 },
  { id: '23', category: 'markets', name: 'DeDust (TON DEX)', description: 'Req: STON.fi lvl 10', baseCost: 1000000, baseProfit: 450000, icon: '🚀', reqUpgrade: '14', reqLevel: 10 },
  { id: '24', category: 'markets', name: 'Margin Trading', description: 'Req: 20 Ads Watched', baseCost: 35000, baseProfit: 45000, icon: '⚡', reqAds: 20 },
  
  // PR & Team
  { id: '3', category: 'pr', name: 'PR Agency', description: 'Professional PR', baseCost: 2500, baseProfit: 1200, icon: '📰' },
  { id: '15', category: 'pr', name: 'Support Team', description: 'Req: PR Agency lvl 2', baseCost: 6000, baseProfit: 2000, icon: '🎧', reqUpgrade: '3', reqLevel: 2 },
  { id: '4', category: 'pr', name: 'Exchange Collab', description: 'Req: Support Team lvl 3', baseCost: 10000, baseProfit: 5000, icon: '🤝', reqUpgrade: '15', reqLevel: 3 },
  { id: '26', category: 'pr', name: 'Growth Hacker', description: 'Req: Exchange Collab lvl 4', baseCost: 35000, baseProfit: 15000, icon: '📈', reqUpgrade: '4', reqLevel: 4 },
  { id: '6', category: 'pr', name: 'Web3 Devs', description: 'Req: Growth Hacker lvl 5', baseCost: 100000, baseProfit: 45000, icon: '🎮', reqUpgrade: '26', reqLevel: 5 },
  { id: '16', category: 'pr', name: 'CTO Hire', description: 'Req: Web3 Devs lvl 6', baseCost: 150000, baseProfit: 60000, icon: '👔', reqUpgrade: '6', reqLevel: 6 },
  { id: '25', category: 'pr', name: 'Security Audits', description: 'Req: CTO Hire lvl 7', baseCost: 220000, baseProfit: 85000, icon: '🔐', reqUpgrade: '16', reqLevel: 7 },
  { id: '17', category: 'pr', name: 'Community Mgr', description: 'Req: 3 Friends', baseCost: 35000, baseProfit: 12000, icon: '🛡️', reqFriends: 3 },
  { id: '7', category: 'pr', name: 'Global Network', description: 'Req: 5 Friends', baseCost: 80000, baseProfit: 30000, icon: '🌍', reqFriends: 5 },
  { id: '27', category: 'pr', name: 'Advisory Board', description: 'Req: 10 Friends', baseCost: 500000, baseProfit: 250000, icon: '🧠', reqFriends: 10 },
  
  // Legal
  { id: '19', category: 'legal', name: 'KYC Provider', description: 'Secure onboarding', baseCost: 12000, baseProfit: 4000, icon: '🆔' },
  { id: '8', category: 'legal', name: 'USA License', description: 'Req: KYC Provider lvl 2', baseCost: 20000, baseProfit: 8000, icon: '📜', reqUpgrade: '19', reqLevel: 2 },
  { id: '18', category: 'legal', name: 'EU Regulation', description: 'Req: USA License lvl 3', baseCost: 40000, baseProfit: 16000, icon: '🇪🇺', reqUpgrade: '8', reqLevel: 3 },
  { id: '9', category: 'legal', name: 'Dubai HQ', description: 'Req: EU Regulation lvl 4', baseCost: 75000, baseProfit: 35000, icon: '🏙️', reqUpgrade: '18', reqLevel: 4 },
  { id: '28', category: 'legal', name: 'Offshore Entity', description: 'Req: Dubai HQ lvl 5', baseCost: 95000, baseProfit: 42000, icon: '🏝️', reqUpgrade: '9', reqLevel: 5 },
  { id: '29', category: 'legal', name: 'Patents', description: 'Req: Offshore lvl 6', baseCost: 180000, baseProfit: 75000, icon: '™️', reqUpgrade: '28', reqLevel: 6 },
  { id: '20', category: 'legal', name: 'Legal Counsel', description: 'Req: Patents lvl 7', baseCost: 200000, baseProfit: 85000, icon: '⚖️', reqUpgrade: '29', reqLevel: 7 },
  { id: '10', category: 'legal', name: 'Ads Premium', description: 'Req: 10 Ads Watched', baseCost: 5000, baseProfit: 25000, icon: '📺', reqAds: 10 },
  { id: '30', category: 'legal', name: 'Tax Optimizer', description: 'Req: 50 Ads Watched', baseCost: 100000, baseProfit: 120000, icon: '💰', reqAds: 50 },
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
            Exchanges
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

          if (upgrade.reqUpgrade && upgrade.reqLevel) {
            const reqLvl = upgrades[upgrade.reqUpgrade] || 0;
            if (reqLvl < upgrade.reqLevel) {
              isLocked = true;
              const reqCard = UPGRADES.find(u => u.id === upgrade.reqUpgrade);
              lockMessage = `Req: ${reqCard?.name} LVL ${upgrade.reqLevel}`;
            }
          }
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
               setLockedPopup({show: true, message: lockMessage});
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
                          <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-[10px] h-[10px] object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
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
                        <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-full h-full object-contain" />
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
