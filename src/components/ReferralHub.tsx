import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatNumber, plushPToPlush } from '../lib/utils';
import { getWeeklyReferralLeaderboard, getUserReferrals, WeeklyLeaderboardUser, ReferredUserLog } from '../lib/firebase';
import { Users, Copy, CheckCircle2, Share2, Sparkles, Star, Trophy, Clock, Flame, UserPlus, Gift, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { GramIcon } from './GramIcon';

export function ReferralHub() {
  const { friends, weeklyReferralCount, userId: storeUserId } = useAppStore();
  const [copiedBotLink, setCopiedBotLink] = useState(false);
  const [copiedAppLink, setCopiedAppLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'contest' | 'list'>('contest');
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(99);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [realFriends, setRealFriends] = useState<ReferredUserLog[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const rawId = tgUser?.id ? String(tgUser.id) : (storeUserId || '1982734');
  const formattedTgId = rawId.startsWith('tg_') ? rawId : `tg_${rawId}`;

  // Bot startapp link format (e.g. https://t.me/PlushTap_bot?startapp=ref_tg_1368899842)
  const botReferralLink = `https://t.me/PlushTap_bot?startapp=ref_${formattedTgId}`;
  
  // App startapp direct link format (e.g. https://t.me/PlushTap_bot/app?startapp=ref_tg_1368899842)
  const appReferralLink = `https://t.me/PlushTap_bot/app?startapp=ref_${formattedTgId}`;

  const shareText = "🔥 Join me on Plush Tap and win real GRAM (TON) rewards for every friend you invite!";
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(botReferralLink)}&text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    async function loadBoard() {
      setLoadingLeaderboard(true);
      const currentUserInfo = {
        id: rawId,
        name: tgUser?.first_name ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'You (Current Player)',
        username: tgUser?.username ? `@${tgUser.username}` : `@user_${rawId.slice(-4)}`,
        weeklyReferralCount: weeklyReferralCount || 0
      };
      const { leaderboard: list, userRank: rank } = await getWeeklyReferralLeaderboard(currentUserInfo);
      setLeaderboard(list);
      setUserRank(rank);
      setLoadingLeaderboard(false);
    }
    loadBoard();
  }, [weeklyReferralCount, rawId]);

  useEffect(() => {
    async function loadFriends() {
      setLoadingFriends(true);
      const list = await getUserReferrals(rawId);
      setRealFriends(list);
      setLoadingFriends(false);
    }
    loadFriends();
  }, [rawId, weeklyReferralCount]);

  const handleCopyBotLink = () => {
    navigator.clipboard.writeText(botReferralLink);
    setCopiedBotLink(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setCopiedBotLink(false), 2000);
  };

  const handleCopyAppLink = () => {
    navigator.clipboard.writeText(appReferralLink);
    setCopiedAppLink(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setCopiedAppLink(false), 2000);
  };

  const handleShare = () => {
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgShareUrl);
    } else if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-lg mx-auto px-3.5 sm:px-5 pt-4 sm:pt-6 pb-28">
      {/* Header Banner */}
      <div className="text-center mb-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
          <Trophy size={14} className="text-amber-400" />
          <span>Weekly GRAM Referral Contest</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Invite Friends & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Earn Real GRAM</span>
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Get up to <strong className="text-amber-300 font-black">10,000,000 $PLUSH</strong> + <strong className="text-cyan-300 font-black">0.025 GRAM</strong> for every friend who joins!
        </p>
      </div>

      {/* Rewards Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              Regular Friend
            </span>
            <UserPlus size={16} className="text-blue-400" />
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 block uppercase">You Receive</span>
              <p className="text-xs font-bold text-white">+2,000,000 $PLUSH</p>
              <p className="text-[10px] font-extrabold text-cyan-300 flex items-center gap-1">
                <GramIcon size={10} /> +0.005 GRAM
              </p>
            </div>
            <div className="pt-1 border-t border-zinc-800">
              <span className="text-[9px] font-bold text-emerald-400 block uppercase">Friend Gets</span>
              <p className="text-[11px] font-semibold text-emerald-300">+1,000,000 $PLUSH + 0.002 GRAM</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 p-3.5 rounded-2xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Premium Friend ⭐
            </span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] font-bold text-amber-400/80 block uppercase">You Receive</span>
              <p className="text-xs font-bold text-amber-200">+10,000,000 $PLUSH</p>
              <p className="text-[10px] font-extrabold text-cyan-300 flex items-center gap-1">
                <GramIcon size={10} /> +0.025 GRAM
              </p>
            </div>
            <div className="pt-1 border-t border-amber-500/20">
              <span className="text-[9px] font-bold text-emerald-400 block uppercase">Friend Gets</span>
              <p className="text-[11px] font-semibold text-emerald-300">+5,000,000 $PLUSH + 0.010 GRAM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Share Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 mb-6 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
            <Zap size={15} className="text-yellow-400" /> Your Telegram Referral Link
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Instant Attribution
          </span>
        </div>

        {/* Primary Link Input */}
        <div className="relative">
          <input
            type="text"
            readOnly
            value={botReferralLink}
            className="w-full bg-black/60 border border-zinc-700/80 rounded-2xl px-3.5 py-3 text-xs font-mono text-zinc-300 pr-24 focus:outline-none"
          />
          <button
            onClick={handleCopyBotLink}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
          >
            {copiedBotLink ? (
              <>
                <CheckCircle2 size={13} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Alternative App Direct Link Toggle */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80">
          <span className="truncate">Direct App Link: <code className="text-zinc-300 font-mono text-[10px]">{appReferralLink}</code></span>
          <button 
            onClick={handleCopyAppLink}
            className="text-amber-400 hover:text-amber-300 font-bold underline shrink-0 ml-2"
          >
            {copiedAppLink ? 'Copied' : 'Copy Direct'}
          </button>
        </div>

        {/* Telegram Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-zinc-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <Share2 size={18} />
          <span>Invite Friends via Telegram</span>
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mb-5">
        <button
          onClick={() => setActiveTab('contest')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'contest'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Flame size={15} />
          <span>Weekly Contest</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          <span>My Friends ({realFriends.length})</span>
        </button>
      </div>

      {/* Tab 1: Weekly Contest Leaderboard */}
      {activeTab === 'contest' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <span className="text-xs font-bold text-zinc-300">Weekly Pool Prize</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-amber-400">58 GRAM + 500M $PLUSH</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-left mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame size={14} /> Weekly Champions (Top 10)
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Rotates Weekly</span>
            </h3>

            {loadingLeaderboard ? (
              <div className="py-8 text-center text-xs text-zinc-500">Loading live standings...</div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      user.isCurrentUser
                        ? 'bg-gradient-to-r from-cyan-950/70 via-zinc-900 to-zinc-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : user.rank === 1
                          ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-zinc-900 border-amber-500/40'
                          : user.rank === 2
                            ? 'bg-gradient-to-r from-slate-500/10 via-zinc-900 to-zinc-900 border-slate-500/30'
                            : user.rank === 3
                              ? 'bg-gradient-to-r from-amber-800/10 via-zinc-900 to-zinc-900 border-amber-800/30'
                              : 'bg-zinc-900/90 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        user.isCurrentUser
                          ? 'bg-cyan-500 text-black'
                          : user.rank === 1
                            ? 'bg-amber-400 text-black'
                            : user.rank === 2
                              ? 'bg-slate-300 text-black'
                              : user.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        #{user.rank}
                      </div>
                      <div className="text-left truncate min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                          {user.isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                              ✨ YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 truncate block">{user.username}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-amber-400 block">
                        {user.weeklyReferralCount} Invites
                      </span>
                      {user.rewardGram > 0 && (
                        <span className="text-[10px] font-bold text-cyan-300 flex items-center justify-end gap-0.5">
                          <GramIcon size={10} /> +{user.rewardGram} GRAM
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show user standing footer if outside Top 10 */}
                {!leaderboard.some(u => u.isCurrentUser) && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/40 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-xs flex items-center justify-center shrink-0">
                        #{userRank}
                      </div>
                      <div className="text-left truncate min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {tgUser?.first_name || 'You'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                            ✨ YOU
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          Need {Math.max(1, (leaderboard[9]?.weeklyReferralCount || 10) - (weeklyReferralCount || 0) + 1)} more invites to enter Top 10!
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-yellow-400 block">{weeklyReferralCount || 0} Invites</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: My Friends */}
      {activeTab === 'list' && (
        <div>
          {loadingFriends ? (
            <div className="py-8 text-center text-xs text-zinc-500">Loading your invited friends...</div>
          ) : realFriends.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6">
              <Users size={32} className="text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No Friends Joined Yet</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
                Share your referral link with Telegram contacts to start earning $PLUSH and real GRAM rewards instantly!
              </p>
              <button
                onClick={handleShare}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                Invite Friends Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {realFriends.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {f.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left truncate min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{f.name}</span>
                        {f.isPremium && (
                          <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                            ⭐ Premium
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate block">{f.username}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-yellow-400 block">
                      +{formatNumber(f.reward)} $PLUSH
                    </span>
                    <span className="text-[10px] font-extrabold text-cyan-300 flex items-center justify-end gap-0.5">
                      <GramIcon size={10} /> +{f.gramReward} GRAM
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
