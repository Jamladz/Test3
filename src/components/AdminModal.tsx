import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Activity, 
  Coins, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  ArrowUpFromLine, 
  CheckCircle2, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { 
  getAdminDashboardData, 
  AdminUserRecord, 
  getWithdrawalRequests, 
  updateWithdrawalStatus, 
  WithdrawalRequestItem 
} from '../lib/firebase';
import { GramIcon } from './GramIcon';
import { formatNumber, plushPToPlush } from '../lib/utils';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals'>('withdrawals');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [data, setData] = useState<{
    totalUsers: number;
    active24h: number;
    totalPlushCoins: number;
    totalGramCoins: number;
    usersList: AdminUserRecord[];
  }>({
    totalUsers: 0,
    active24h: 0,
    totalPlushCoins: 0,
    totalGramCoins: 0,
    usersList: []
  });

  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawalRequestItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await getAdminDashboardData();
    const withdraws = await getWithdrawalRequests();
    setData(res);
    setWithdrawRequests(withdraws);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyWallet = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    const ok = await updateWithdrawalStatus(requestId, status);
    if (ok) {
      setWithdrawRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
    }
  };

  const filteredUsers = data.usersList.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawals = withdrawRequests.filter(w =>
    w.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.recipientAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center text-amber-400 font-bold">
                  <ShieldCheck size={22} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  Admin Review Panel <span className="text-xs font-normal text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">@sekanedr_is</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Withdrawal Review & System Management</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowUpFromLine size={14} />
              <span>Withdraw Requests ({withdrawRequests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Users Overview ({data.totalUsers})</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-amber-400" />
              <span>Fetching live Firestore data for @sekanedr_is...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* WITHDRAWALS TAB */}
              {activeTab === 'withdrawals' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search withdrawal username or TON address..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {filteredWithdrawals.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        No pending withdrawal requests found.
                      </div>
                    ) : (
                      filteredWithdrawals.map((req) => (
                        <div
                          key={req.id}
                          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white">{req.username}</span>
                              <span className="text-[9px] text-zinc-500">({req.createdAt})</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {req.status}
                            </span>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                            <span className="text-[10px] text-zinc-400 font-medium">Requested Amount:</span>
                            <span className="text-sm font-black text-cyan-300 flex items-center gap-1">
                              {req.currency === 'GRAM' ? <GramIcon size={14} /> : null}
                              {req.amount} {req.currency}
                            </span>
                          </div>

                          {/* TON Wallet Address with Copy */}
                          <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 text-[11px]">
                            <span className="text-zinc-500 font-mono truncate pr-2">
                              Address: {req.recipientAddress}
                            </span>
                            <button
                              onClick={() => handleCopyWallet(req.recipientAddress, req.id)}
                              className="text-amber-400 hover:text-amber-300 shrink-0 font-bold flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800"
                            >
                              {copiedId === req.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedId === req.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* Action Buttons */}
                          {req.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                className="py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Total Users */}
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 text-left">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold mb-1">
                        <span>Total Users</span>
                        <Users size={14} className="text-blue-400" />
                      </div>
                      <span className="text-lg font-black text-white">{data.totalUsers}</span>
                      <span className="text-[9px] text-zinc-500 block">Registered Players</span>
                    </div>

                    {/* Active 24h Users */}
                    <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-3 text-left">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold mb-1">
                        <span>Active (24 Hours)</span>
                        <Activity size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-lg font-black text-emerald-400">{data.active24h}</span>
                      <span className="text-[9px] text-emerald-400/80 block">Active in last 24h</span>
                    </div>

                    {/* Total $PLUSH Coins */}
                    <div className="bg-zinc-900/90 border border-yellow-500/30 rounded-2xl p-3 text-left">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold mb-1">
                        <span>Total $PLUSH Mined</span>
                        <Coins size={14} className="text-yellow-400" />
                      </div>
                      <span className="text-sm font-black text-yellow-400">{formatNumber(plushPToPlush(data.totalPlushCoins))} $P</span>
                      <span className="text-[9px] text-zinc-500 block">{formatNumber(data.totalPlushCoins)} PlushP</span>
                    </div>

                    {/* Total GRAM Coins */}
                    <div className="bg-zinc-900/90 border border-cyan-500/30 rounded-2xl p-3 text-left">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold mb-1">
                        <span>Total GRAM Distributed</span>
                        <GramIcon size={14} />
                      </div>
                      <span className="text-sm font-black text-cyan-300">{data.totalGramCoins.toFixed(3)} GRAM</span>
                      <span className="text-[9px] text-cyan-400 block">Crypto Payouts</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search Telegram username or ID..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  </div>

                  {/* Users List */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredUsers.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        No matching users found.
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-left"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white truncate">{user.username}</span>
                              {user.isActive24h && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active in last 24h" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                              <span>{user.firstName}</span>
                              <span>•</span>
                              <span className="text-blue-400 font-bold">{user.totalReferrals} Refs</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-yellow-400 block">
                              {formatNumber(plushPToPlush(user.balance))} $P
                            </span>
                            <span className="text-[10px] font-black text-cyan-300 flex items-center justify-end gap-1">
                              <GramIcon size={11} /> {user.gramBalance} GRAM
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-2xl transition-colors mt-2"
              >
                Close Admin Panel
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
