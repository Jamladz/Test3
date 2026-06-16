import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatNumber, formatCurrency } from '../lib/utils';
import { Users, Coins, Activity, ShieldAlert, BarChart3, TrendingUp, Settings2, Zap, ArrowUpRight, Flame, Globe, CreditCard, LayoutDashboard } from 'lucide-react';
import { GameService } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function Admin() {
  const { username } = useGameStore();
  const [stats, setStats] = useState({ totalUsers: 0, totalEconomy: 0, bannedBots: 0, users: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'withdrawals' | 'goals'>('dashboard');

  const { matches, fetchMatches } = useGameStore();
  const [newMatch, setNewMatch] = useState({
     teamA: { name: '', image: '' },
     teamB: { name: '', image: '' },
     matchDate: '',
     status: 'upcoming'
  });
  const [editingScores, setEditingScores] = useState<{ [key: string]: { a: number, b: number } }>({});

  
  const fetchStats = async () => {
    try {
      const data = await GameService.getAdminStats();
      setStats(data);
      await fetchMatches();
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (username === 'sekanedr_is') {
      fetchStats();
      interval = setInterval(() => {
        fetchStats();
      }, 15000); // refresh every 15 seconds
    } else {
       setLoading(false);
    }
    return () => clearInterval(interval);
  }, [username]);

  const handleBanToggle = async (uid: string, isBanned: boolean) => {
    if (confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) {
      await GameService.setBanStatus(uid, !isBanned);
      fetchStats();
    }
  };

  const handleConfirmWithdrawal = async (uid: string, withdrawalId: string) => {
    if (confirm(`Confirm you sent TON to their wallet?`)) {
      await GameService.confirmWithdrawal(uid, withdrawalId);
      fetchStats();
    }
  };

  const handleAddMatch = async () => {
    if (!newMatch.matchDate) return alert("Please select a date and time");
    const d = new Date(newMatch.matchDate);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const matchData = {
      ...newMatch,
      timestamp: d.getTime(),
      day: d.getDate().toString(),
      month: months[d.getMonth()],
      matchTime: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    await GameService.addMatch(matchData);
    setNewMatch({ teamA: { name: '', image: '' }, teamB: { name: '', image: '' }, matchDate: '', status: 'upcoming' });
    fetchMatches();
  };

  const handleUpdateMatchScore = async (id: string) => {
    const scores = editingScores[id];
    if (!scores) return;
    const data: any = { 
       'teamA.score': scores.a, 
       'teamB.score': scores.b 
    };
    await GameService.updateMatch(id, data);
    alert('Scores updated!');
    fetchMatches();
  };

  const handleUpdateMatchStatus = async (id: string, status: string, winner?: string) => {
    const data: any = { status };
    if (winner) data.winner = winner;
    await GameService.updateMatch(id, data);
    fetchMatches();
  };

  if (username !== 'sekanedr_is') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-sm">You do not have administrative privileges.</p>
      </div>
    );
  }

  const withdrawals = stats.users.flatMap(u => (u.withdrawals || []).map((w: any) => ({...w, user: u})));
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  
  // Calculate active users (synced within last 45 seconds)
  const activeNowCount = stats.users.filter(u => Date.now() - (u.lastLogin || 0) < 45 * 1000).length;

  // Dynamic User Growth
  const generateGrowthData = () => {
    const now = Date.now();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const startOfDay = new Date(d).setHours(0,0,0,0);
      const endOfDay = new Date(d).setHours(23,59,59,999);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const newUsers = stats.users.filter(u => u.createdAt >= startOfDay && u.createdAt <= endOfDay).length;
      const totalToDay = stats.users.filter(u => u.createdAt <= endOfDay).length;
      result.push({ time: dayLabel, active: totalToDay, new: newUsers });
    }
    return result;
  };
  const activityData = generateGrowthData();

  // Dynamic Economy Data (simulated distribution)
  const generateEconomyData = () => {
    const now = Date.now();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const totalCoins = stats.totalEconomy;
      // Deterministic spread
      const randomSeed = Math.abs(Math.sin((d.getDay() + 1) * 12345)); 
      
      result.push({ 
        day: dayLabel, 
        minted: totalCoins > 0 ? (totalCoins * 0.1 * randomSeed) / 1000000 : 0, 
        burned: totalCoins > 0 ? (totalCoins * 0.02 * randomSeed) / 1000000 : 0 
      });
    }
    return result;
  };
  const economyData = generateEconomyData();

  return (
    <div className="flex flex-col flex-1 w-full h-full bg-[#0a0a0c] text-white overflow-hidden relative">
      {/* Top Navigation / Header */}
      <div className="flex-none px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#111114] border-b border-white/5 z-20 relative gap-4 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f3ff]/20 to-[#ffaa00]/20 flex items-center justify-center border border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <Settings2 size={20} className="text-[#00f3ff]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">Command Center</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">System Live • V1.0</p>
            </div>
          </div>
          <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400 font-bold tracking-wider">{activeNowCount} ONLINE</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-white/10 text-white shadow-md' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'players' 
                ? 'bg-[#00f3ff]/10 text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.1)]' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} />
            Players <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{stats.users.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'withdrawals' 
                ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard size={16} />
            Withdrawals 
            {pendingWithdrawalsCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">{pendingWithdrawalsCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'goals' 
                ? 'bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={16} />
            Goals
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-green-400 font-bold tracking-wider">{activeNowCount} ONLINE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-28 no-scrollbar custom-scroll relative z-10">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
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
                  {loading ? '...' : formatNumber(activeNowCount)} <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#151518] border border-white/5 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00f3ff]" />
                    USER GROWTH (24H)
                  </h3>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
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
                    <BarChart data={economyData}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
              <div className="bg-[#151518] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ffaa00]/10 rounded-lg text-[#ffaa00]">
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
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm tracking-widest text-gray-400 mb-4">PENDING WITHDRAWALS ({pendingWithdrawalsCount})</h2>
            <div className="bg-[#151518] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col flex-1 h-full min-h-[400px]">
               <div className="overflow-y-auto custom-scroll w-full p-4 space-y-3">
                  {pendingWithdrawalsCount === 0 ? (
                     <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                       <CreditCard size={48} className="mb-4 opacity-20" />
                       <p className="font-medium text-lg text-white">All caught up!</p>
                       <p className="text-sm">No pending withdrawals require action.</p>
                     </div>
                  ) : (
                     withdrawals.filter(w => w.status === 'pending').map((w: any) => (
                        <div key={w.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/10 p-4 rounded-xl gap-4">
                           <div className="w-full">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-white font-bold">{w.user.firstName} (@{w.user.username})</div>
                                <div className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Under Review</div>
                              </div>
                              <div className="text-[#00f3ff] font-bold my-1 text-lg">{w.amount} {w.token || 'TON'}</div>
                              <div className="text-xs text-gray-400 font-mono mt-2 bg-[#111114] p-2 rounded-lg border border-white/5 flex items-center justify-between group">
                                 <span className="truncate mr-2" title={w.wallet !== 'UnknownWallet' ? w.wallet : (w.user.walletAddress || 'UnknownWallet')}>Wallet: {w.wallet !== 'UnknownWallet' ? w.wallet : (w.user.walletAddress || 'UnknownWallet')}</span>
                                 <button
                                   onClick={() => {
                                     const walletToCopy = w.wallet !== 'UnknownWallet' ? w.wallet : (w.user.walletAddress || 'UnknownWallet');
                                     navigator.clipboard.writeText(walletToCopy).then(() => {
                                       const twa = (window as any).Telegram?.WebApp;
                                       if (twa?.HapticFeedback) twa.HapticFeedback.impactOccurred('light');
                                       alert('Wallet address copied to clipboard!');
                                     }).catch(() => {
                                       alert('Failed to copy. ' + walletToCopy);
                                     });
                                   }}
                                   className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-all active:scale-95 text-gray-400 hover:text-white shrink-0 opacity-80 group-hover:opacity-100"
                                   title="Copy Wallet Address"
                                 >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                 </button>
                              </div>
                           </div>
                           <button onClick={() => handleConfirmWithdrawal(w.user.uid, w.id)} className="w-full sm:w-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 hover:bg-green-500/30 text-green-400 font-bold text-sm px-6 py-3 rounded-xl whitespace-nowrap transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] active:scale-95">
                              Mark as Completed
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div className="space-y-4 pb-8">
            <h2 className="font-bold text-sm tracking-widest text-gray-400 mb-2">TELEGRAM PLAYERS DIRECTORY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {stats.users.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 bg-[#151518] rounded-2xl border border-white/5">
                     {loading ? 'Scanning database...' : 'No players found'}
                  </div>
               ) : (
                  stats.users.map((u, i) => (
                    <div key={u.id || i} className="bg-[#151518] border border-white/5 rounded-2xl p-4 flex flex-col hover:border-white/10 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f3ff]/20 to-[#ffaa00]/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ring-1 ring-white/10">
                             {u.firstName?.[0] || '?'}
                          </div>
                          <div className="overflow-hidden">
                             <div className="font-bold text-white truncate text-lg">{u.firstName}</div>
                             <div className="text-xs text-gray-500 font-mono truncate">@{u.username || 'unknown'}</div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Balance</p>
                            <div className="font-bold text-[#FFD700] flex items-center gap-1.5 text-sm">
                               <Coins size={12} className="drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                               {formatCurrency(u.balance || 0)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tap Value</p>
                            <div className="font-bold text-gray-300 font-mono text-sm flex items-center gap-1.5">
                               <Coins size={12} className="opacity-50" />
                               {formatCurrency(u.totalTapped || 0)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Join Date</p>
                            <div className="text-xs text-gray-300 font-bold">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Legacy'}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Ads</p>
                            <div className="inline-flex items-center gap-1.5 text-[#00f3ff] font-mono text-sm font-bold">
                               <Zap size={12} className="text-[#00f3ff]" />
                               {u.adsWatched || 0}
                            </div>
                          </div>
                       </div>

                       <div className="mt-auto pt-2 border-t border-white/5 flex gap-2">
                           <div className="flex-1 text-[10px] text-gray-500 font-mono flex items-center">
                             ID: {u.id?.substring(0, 10)}...
                           </div>
                           <button 
                              onClick={() => handleBanToggle(u.uid, u.role === 'banned')}
                              className={`px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10 active:scale-95 ${u.role === 'banned' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                           >
                              {u.role === 'banned' ? 'Unban' : 'Ban User'}
                           </button>
                       </div>
                    </div>
                  ))
               )}
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
        <div className="space-y-4 pb-8 px-4 sm:px-6">
          <h2 className="font-bold text-sm tracking-widest text-gray-400 mb-2">MANAGE MATCHES & PREDICTIONS</h2>
          
          <div className="bg-[#151518] border border-white/5 bg-white/5 p-4 rounded-xl mb-6">
            <h3 className="font-bold text-sm mb-4">Add New Match</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Team A Name</label>
                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00f3ff]" value={newMatch.teamA.name} onChange={e => setNewMatch({...newMatch, teamA: {...newMatch.teamA, name: e.target.value}})} />
               </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Team A Image URL</label>
                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00f3ff]" value={newMatch.teamA.image} onChange={e => setNewMatch({...newMatch, teamA: {...newMatch.teamA, image: e.target.value}})} />
               </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Team B Name</label>
                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00f3ff]" value={newMatch.teamB.name} onChange={e => setNewMatch({...newMatch, teamB: {...newMatch.teamB, name: e.target.value}})} />
               </div>
               <div>
                  <label className="text-xs text-gray-500 mb-1 block">Team B Image URL</label>
                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00f3ff]" value={newMatch.teamB.image} onChange={e => setNewMatch({...newMatch, teamB: {...newMatch.teamB, image: e.target.value}})} />
               </div>
               <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Match Date & Time</label>
                  <input type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00f3ff]" value={newMatch.matchDate} onChange={e => setNewMatch({...newMatch, matchDate: e.target.value})} />
               </div>
            </div>
            <button
               onClick={handleAddMatch}
               className="mt-4 w-full bg-[#00f3ff] hover:bg-[#00f3ff]/90 text-black py-2 rounded font-bold transition-all active:scale-95"
            >
               Create Match
            </button>
          </div>

          <div className="space-y-4">
             {matches.map(m => (
               <div key={m.id} className="bg-[#151518] border border-white/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-xs bg-white/10 px-2 py-1 rounded">{m.day} {m.month} {m.matchTime}</span>
                     <span className={`text-xs px-2 py-1 rounded uppercase font-bold focus:outline-none focus:border-[#00f3ff] ${m.status === 'live' ? 'bg-red-500/20 text-red-500' : m.status === 'upcoming' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                        {m.status}
                     </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex gap-2 items-center flex-1">
                        <img src={m.teamA.image} alt={m.teamA.name} className="w-8 h-8 rounded-full bg-white/5" />
                        <span className="font-bold text-sm truncate">{m.teamA.name}</span>
                     </div>
                     
                     <div className="flex gap-2 items-center justify-center px-4">
                        <input 
                          type="number" 
                          min="0"
                          className="w-10 bg-black/40 border border-white/10 rounded py-1 text-center text-sm font-bold focus:outline-none focus:border-[#00f3ff]" 
                          value={editingScores[m.id]?.a ?? m.teamA.score ?? 0}
                          onChange={e => setEditingScores({...editingScores, [m.id]: { ...(editingScores[m.id] || {a:0, b:0}), a: parseInt(e.target.value) || 0 }})}
                        />
                        <span className="text-xs text-gray-500 font-bold">-</span>
                        <input 
                          type="number" 
                          min="0"
                          className="w-10 bg-black/40 border border-white/10 rounded py-1 text-center text-sm font-bold focus:outline-none focus:border-[#00f3ff]" 
                          value={editingScores[m.id]?.b ?? m.teamB.score ?? 0}
                          onChange={e => setEditingScores({...editingScores, [m.id]: { ...(editingScores[m.id] || {a:0, b:0}), b: parseInt(e.target.value) || 0 }})}
                        />
                     </div>

                     <div className="flex gap-2 items-center flex-1 justify-end">
                        <span className="font-bold text-sm truncate">{m.teamB.name}</span>
                        <img src={m.teamB.image} alt={m.teamB.name} className="w-8 h-8 rounded-full bg-white/5" />
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                     <button onClick={() => handleUpdateMatchScore(m.id)} className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs py-2 rounded transition-all font-bold mb-2 border border-green-500/20">Save Scores</button>
                     <div className="flex gap-2">
                        <button onClick={() => handleUpdateMatchStatus(m.id, 'upcoming')} className="flex-1 bg-white/5 hover:bg-white/10 text-xs py-2 rounded transition-all">Set Upcoming</button>
                        <button onClick={() => handleUpdateMatchStatus(m.id, 'live')} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs py-2 rounded transition-all">Set LIVE</button>
                     </div>
                     <div className="grid grid-cols-3 gap-2 mt-2">
                        <button onClick={() => handleUpdateMatchStatus(m.id, 'completed', 'A')} className="bg-[#00f3ff]/20 text-[#00f3ff] text-xs py-2 rounded">Winner: {m.teamA.name}</button>
                        <button onClick={() => handleUpdateMatchStatus(m.id, 'completed', 'draw')} className="bg-yellow-500/20 text-yellow-500 text-xs py-2 rounded">Draw</button>
                        <button onClick={() => handleUpdateMatchStatus(m.id, 'completed', 'B')} className="bg-[#00f3ff]/20 text-[#00f3ff] text-xs py-2 rounded">Winner: {m.teamB.name}</button>
                     </div>
                  </div>
               </div>
             ))}
             {matches.length === 0 && <div className="text-center text-gray-500 py-4 text-sm mt-4">No matches added yet</div>}
          </div>
        </div>
      )}
      </div>

      <div className="p-3 border-t border-white/5 bg-[#111114] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 font-mono z-20">
        <div className="flex items-center gap-2">
           <Globe size={14} className="text-[#00f3ff]" />
           <span className="uppercase tracking-widest text-[10px]">Cloudflare Pages Deployment Ready</span>
        </div>
        <div className="text-[10px] opacity-70">
           To deploy: <code className="bg-black px-2 py-0.5 rounded text-[#FFD700]">npm run build</code> then <code className="bg-black px-2 py-0.5 rounded text-[#00f3ff]">npx wrangler pages deploy dist</code>
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

