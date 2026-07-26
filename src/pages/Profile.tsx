import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatNumber, plushPToPlush } from '../lib/utils';
import { User, Wallet, LogOut, Trophy, ShieldCheck, Star, HelpCircle, ChevronRight, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Season1Modal } from '../components/Season1Modal';
import { WithdrawalModal } from '../components/WithdrawalModal';
import { AdminModal } from '../components/AdminModal';
import { GramIcon } from '../components/GramIcon';
import { AnimatePresence } from 'motion/react';

export function Profile() {
  const { balance, gramBalance, friends, tasksCompleted, season1Stats, resetState, username: storeUsername } = useAppStore();
  const [showS1Modal, setShowS1Modal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const username = tgUser?.username ? `@${tgUser.username}` : (storeUsername || '@plush_pepe_user');
  const fullName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Plush Pepe Player';
  const isPremium = tgUser?.is_premium || false;
  const avatarUrl = tgUser?.photo_url;

  const rawUser = (tgUser?.username || storeUsername || '').replaceAll('@', '').toLowerCase();
  const isAdminUser = rawUser === 'sekanedr_is' || rawUser === 'sekanedr';

  return (
    <div className="flex flex-col flex-1 w-full px-5 pt-8 pb-28">
      <h1 className="text-2xl font-black text-white mb-6 text-center">User Profile & Wallet</h1>

      {/* Profile Card */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-6 border border-gray-800 flex flex-col items-center mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mb-3">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-500 rounded-2xl p-0.5 shadow-lg">
            <div className="w-full h-full bg-gray-950 rounded-2xl flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-emerald-400" />
              )}
            </div>
          </div>
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-full border-2 border-gray-950 shadow">
              <Star size={12} className="fill-white" />
            </div>
          )}
        </div>

        <h2 className="text-lg font-black text-white flex items-center gap-1.5">
          {fullName}
          <ShieldCheck size={16} className="text-blue-400" />
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{username}</p>

        <div className="w-full h-[1px] bg-gray-800/80 my-5" />

        {/* User Stats & Wallet Balances Grid */}
        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* $PLUSH Balance */}
            <div className="bg-zinc-900 p-3 rounded-2xl border border-emerald-500/20 text-left">
              <div className="text-[10px] text-zinc-400 font-bold mb-1">$PLUSH Balance</div>
              <div className="text-sm font-black text-yellow-400 truncate">{formatNumber(plushPToPlush(balance))} $PLUSH</div>
              <div className="text-[10px] text-zinc-400 font-bold">{formatNumber(balance)} PlushP</div>
            </div>

            {/* GRAM Balance */}
            <div className="bg-zinc-900 p-3 rounded-2xl border border-cyan-500/20 text-left">
              <div className="text-[10px] text-zinc-400 font-bold mb-1 flex items-center gap-1">
                <GramIcon size={14} />
                <span>GRAM Balance</span>
              </div>
              <div className="text-sm font-black text-cyan-300 truncate">{gramBalance.toLocaleString()} GRAM</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-900/80 p-2.5 rounded-2xl border border-gray-800">
              <p className="text-[10px] text-gray-400 mb-0.5 font-bold">Referrals</p>
              <p className="text-xs font-black text-blue-400">{friends.length}</p>
            </div>
            <div className="bg-gray-900/80 p-2.5 rounded-2xl border border-gray-800">
              <p className="text-[10px] text-gray-400 mb-0.5 font-bold">Quests Done</p>
              <p className="text-xs font-black text-emerald-400">{tasksCompleted.length}</p>
            </div>
          </div>

          {/* Withdraw Funds Button */}
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <ArrowUpRight size={18} />
            <span>Withdraw $PLUSH / GRAM (0.5 TON Fee)</span>
          </button>
        </div>
      </div>

      {/* Season 1 Banner Card */}
      <button
        onClick={() => setShowS1Modal(true)}
        className="w-full mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 hover:border-amber-400 p-4 rounded-3xl flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-amber-500/10 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Season 1 Summary</span>
            <h3 className="font-black text-sm text-white">Season 1 Achievements & Airdrop</h3>
            <p className="text-[11px] text-amber-300 font-bold">
              {season1Stats.claimedBonus ? 'Season 1 Reward Claimed' : 'Claim +50,000 $PLUSH Veteran Reward'}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="text-amber-400" />
      </button>

      {/* Admin Panel Button (Visible ONLY for Telegram username @sekanedr_is) */}
      {isAdminUser && (
        <button
          onClick={() => setShowAdminModal(true)}
          className="w-full mb-4 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border-2 border-amber-500/50 hover:border-amber-400 p-4 rounded-3xl flex items-center justify-between transition-all active:scale-95 shadow-xl shadow-amber-500/10 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Admin Panel
                </span>
                <span className="text-[10px] font-bold text-amber-300">@sekanedr_is</span>
              </div>
              <h3 className="font-black text-sm text-white mt-0.5">Control & Telegram Users Dashboard</h3>
              <p className="text-[11px] text-zinc-400">View user balances, active 24h count & referral stats</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-amber-400" />
        </button>
      )}

      {/* Account Settings List */}
      <div className="space-y-3">
        {/* Ton Wallet Integration */}
        <div className="bg-gray-900 rounded-2xl p-3.5 border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
              <Wallet size={20} />
            </div>
            <div className="text-left">
              <span className="font-bold text-xs text-white block">Connect TON Wallet</span>
              <span className="text-[10px] text-gray-400">Receive future Airdrop & GRAM payouts</span>
            </div>
          </div>
          <TonConnectButton />
        </div>

        <button className="w-full bg-gray-900 rounded-2xl p-3.5 border border-gray-800 flex items-center justify-between text-left hover:bg-gray-800/80 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 p-2 rounded-xl text-gray-300">
              <HelpCircle size={20} />
            </div>
            <div>
              <span className="font-bold text-xs text-white block">Support & Airdrop FAQ</span>
              <span className="text-[10px] text-gray-400">Airdrop rules & distribution details</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-500" />
        </button>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showS1Modal && <Season1Modal onClose={() => setShowS1Modal(false)} />}
        {showWithdrawalModal && <WithdrawalModal isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} />}
        {showAdminModal && <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

