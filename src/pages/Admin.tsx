import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatNumber, formatCurrency } from '../lib/utils';
import { Users, Coins, Activity, ShieldAlert, BarChart3, TrendingUp, Settings2, Zap, ArrowUpRight, Flame, Globe } from 'lucide-react';
import { GameService } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const mockActivityData = [
  { time: '00:00', active: 120, new: 10 },
  { time: '04:00', active: 85, new: 5 },
  { time: '08:00', active: 240, new: 45 },
  { time: '12:00', active: 580, new: 120 },
  { time: '16:00', active: 890, new: 210 },
  { time: '20:00', active: 1100, new: 340 },
  { time: '24:00', active: 950, new: 180 },
];

const mockEconomyData = [
  { day: 'Mon', minted: 15, burned: 2 },
  { day: 'Tue', minted: 18, burned: 3 },
  { day: 'Wed', minted: 24, burned: 5 },
  { day: 'Thu', minted: 21, burned: 4 },
  { day: 'Fri', minted: 35, burned: 8 },
  { day: 'Sat', minted: 42, burned: 12 },
  { day: 'Sun', minted: 55, burned: 15 },
];

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

  if (username !== 'sekanedr_is') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-sm">You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#0a0a0c] text-white overflow-hidden relative">
      {/* Top Navigation / Header */}
      <div className="flex-none px-6 py-4 flex justify-between items-center bg-[#111114] border-b border-white/5 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f3ff]/20 to-blue-600/20 flex items-center justify-center border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <Settings2 size={20} className="text-[#00f3ff]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Command Center</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">System Live • V1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-green-400 font-bold tracking-wider">ONLINE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-4 md:px-6 py-6 space-y-6 no-scrollbar custom-scroll relative z-10">
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151518] border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00f3ff]/5 rounded-full blur-2xl group-hover:bg-[#00f3ff]/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#00f3ff]/10 rounded-lg ring-1 ring-[#00f3ff]/20 text-[#00f3ff]">
                <Users size={16} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={12} className="mr-0.5"/> 24%
              </span>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-1">Total Players</p>
            <h3 className="text-2xl font-bold font-mono tracking-tight">{loading ? '...' : formatNumber(stats.totalUsers)}</h3>
          </div>

          <div className="bg-[#151518] border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg ring-1 ring-purple-500/20 text-purple-400">
                <Activity size={16} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={12} className="mr-0.5"/> 12%
              </span>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-1">Active Now</p>
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              1,204 <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            </h3>
          </div>

          <div className="bg-[#151518] border border-[#FFD700]/10 p-4 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.02)]">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#FFD700]/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#FFD700]/10 rounded-lg ring-1 ring-[#FFD700]/20 text-[#FFD700]">
                <Coins size={16} />
              </div>
            </div>
            <p className="text-sm text-[#FFD700]/60 font-medium mb-1">Total Economy</p>
            <h3 className="text-xl font-bold font-mono tracking-tight text-[#FFD700] truncate">
              {loading ? '...' : formatCurrency(stats.totalEconomy)}
            </h3>
          </div>

          <div className="bg-[#151518] border border-red-500/10 p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg ring-1 ring-red-500/20 text-red-500">
                <ShieldAlert size={16} />
              </div>
            </div>
            <p className="text-sm text-red-400/60 font-medium mb-1">Banned Bots</p>
            <h3 className="text-2xl font-bold font-mono tracking-tight text-red-500">
              {loading ? '...' : formatNumber(stats.bannedBots)}
            </h3>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#151518] border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <TrendingUp size={16} className="text-[#00f3ff]" />
                USER GROWTH (24H)
              </h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockActivityData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#00f3ff' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#00f3ff" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#151518] border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <BarChart3 size={16} className="text-[#FFD700]" />
                ECONOMY FLOW (Millions)
              </h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockEconomyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="minted" fill="#FFD700" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="burned" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <h2 className="font-bold text-sm tracking-widest text-gray-400 mt-6 mb-2">SYSTEM CONTROLS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
          <div className="bg-[#151518] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Global Multiplier</h4>
                  <p className="text-xs text-gray-500">Affects all players globally</p>
                </div>
              </div>
            </div>
            <select className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#00f3ff] transition-colors appearance-none cursor-pointer">
              <option value="1">1.0x (Standard Rate)</option>
              <option value="1.5">1.5x (Weekend Event)</option>
              <option value="2">2.0x (Super Event)</option>
              <option value="5">5.0x (Insane Boost)</option>
            </select>
          </div>

          <div className="bg-[#151518] border border-[#00f3ff]/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff]/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00f3ff]/10 rounded-lg text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                  <Flame size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Airdrop Snapshot</h4>
                  <p className="text-xs text-[#00f3ff]/60">Trigger phase 3 balancing</p>
                </div>
              </div>
            </div>
            <button className="w-full bg-[#00f3ff] hover:bg-[#00f3ff]/90 text-black rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              Initiate TGE Snapshot
            </button>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-white/5 bg-[#111114] flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
        <Globe size={12} />
        Secured by Cloudflare Infrastructure
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
