import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatNumber } from '../lib/utils';
import { Users, Coins, Activity, ShieldAlert } from 'lucide-react';
import { GameService } from '../services/api';

export function Admin() {
  const { username } = useGameStore();
  const [stats, setStats] = useState({ totalUsers: 0, totalEconomy: 0, bannedBots: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username === 'sekanedr_is') {
      GameService.getAdminStats().then(data => {
         setStats(data);
         setLoading(false);
      }).catch(e => {
         console.error(e);
         setLoading(false);
      });
    } else {
       setLoading(false);
    }
  }, [username]);

  return (
    <div className="flex flex-col w-full px-4 overflow-y-auto min-h-0 pb-6 no-scrollbar">
      <h1 className="text-2xl font-bold mb-6 text-[#00f3ff] border-b border-white/10 pb-4">Admin Dashboard</h1>
      
      {loading ? (
         <div className="text-center py-10 opacity-50 font-mono">Loading stats...</div>
      ) : (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-[1.25rem] flex flex-col">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Users size={16} />
            <span className="text-xs font-bold uppercase">Total Users</span>
          </div>
          <span className="text-2xl font-mono text-white">{formatNumber(stats.totalUsers)}</span>
        </div>
        
        <div className="glass-panel p-4 rounded-[1.25rem] flex flex-col">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase">Online Now</span>
          </div>
          <span className="text-2xl font-mono text-[#00f3ff]">1</span>
        </div>

        <div className="glass-panel p-4 rounded-[1.25rem] flex flex-col">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Coins size={16} />
            <span className="text-xs font-bold uppercase">Economy Total</span>
          </div>
          <span className="text-2xl font-mono text-[#FFD700]">{formatNumber(stats.totalEconomy)}</span>
        </div>

        <div className="glass-panel p-4 rounded-[1.25rem] flex flex-col border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold uppercase">Banned Bots</span>
          </div>
          <span className="text-2xl font-mono text-red-500">{stats.bannedBots}</span>
        </div>
      </div>
      )}

      <h2 className="text-lg font-bold mb-4">Economy Controls</h2>
      <div className="glass-panel p-4 rounded-[1.25rem] space-y-5 mb-8">
        <div className="flex justify-between items-center">
           <span className="text-sm font-bold">Global Tap Multiplier</span>
           <select className="bg-[#1c1c1e] border border-white/10 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none text-[#FFD700]">
              <option>1x</option>
              <option>1.5x (Event)</option>
              <option>2x (Super Event)</option>
           </select>
        </div>
        <div className="w-full h-px bg-white/5 my-2"></div>
        <div className="flex justify-between items-center">
           <span className="text-sm font-bold">Airdrop Phase</span>
           <button className="bg-[#00f3ff] text-black px-4 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-[0_0_10px_rgba(0,243,255,0.4)]">Start Snapshot</button>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 text-center mt-auto uppercase tracking-widest font-mono">Secured by Cloudflare</p>
    </div>
  );
}
