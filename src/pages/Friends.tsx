import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatNumber, plushPToPlush } from '../lib/utils';
import { getWeeklyReferralLeaderboard, WeeklyLeaderboardUser } from '../lib/firebase';
import { Users, Copy, CheckCircle2, Share2, Sparkles, Star, Trophy, Clock, Flame, UserPlus, HelpCircle, Gift, ArrowRight, ShieldCheck } from 'lucide-react';
import { GramIcon } from '../components/GramIcon';

export function Friends() {
  const { friends, addFriend, weeklyReferralCount } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'contest' | 'list'>('contest');
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(99);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id ? String(tgUser.id) : '1982734';
  
  const referralLink = `https://t.me/PlushTap_bot/app?startapp=ref_${userId}`;
  const shareText = "🔥 Join me on Plush Tap and win real GRAM (TON) rewards for every friend you invite!";
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    async function loadBoard() {
      setLoadingLeaderboard(true);
      const currentUserInfo = {
        id: userId,
        name: tgUser?.first_name ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'You (Current Player)',
        username: tgUser?.username ? `@${tgUser.username}` : `@user_${userId.slice(-4)}`,
        weeklyReferralCount: weeklyReferralCount || 0
      };
      const { leaderboard: list, userRank: rank } = await getWeeklyReferralLeaderboard(currentUserInfo);
      setLeaderboard(list);
      setUserRank(rank);
      setLoadingLeaderboard(false);
    }
    loadBoard();
  }, [weeklyReferralCount, userId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setCopied(false), 2000);
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
      <div className="text-center mb-4 sm:mb-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-blue-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl shadow-amber-500/5">
          <Trophy size={28} className="text-amber-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Referrals & Weekly Contest</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto leading-relaxed">
          Invite friends to earn <strong className="text-yellow-400">PlushP</strong> and win real <strong className="text-cyan-300">GRAM (TON)</strong> weekly crypto prizes!
        </p>
      </div>

      {/* 3-Step Simple Explanation Card */}
      <div className="bg-zinc-900/90 border border-amber-500/20 rounded-2xl p-3 sm:p-4 mb-4 shadow-lg">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase text-amber-400 mb-2.5">
          <Sparkles size={14} /> How To Win Weekly GRAM Prizes:
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-zinc-950/80 border border-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center">
            <span className="text-amber-400 font-black text-xs sm:text-sm mb-0.5">1. Share</span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400 leading-tight">Send link to friends</span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center">
            <span className="text-amber-400 font-black text-xs sm:text-sm mb-0.5">2. Earn</span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400 leading-tight">+2M / +10M PlushP</span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800 p-2 rounded-xl flex flex-col items-center justify-center">
            <span className="text-cyan-300 font-black text-xs sm:text-sm mb-0.5">3. Win</span>
            <span className="text-[9px] sm:text-[10px] text-cyan-400 leading-tight">Top 3 get GRAM</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 mb-4 sm:mb-5">
        <button
          onClick={() => setActiveTab('contest')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'contest'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy size={15} />
          Weekly Contest
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          My Invites ({friends.length})
        </button>
      </div>

      {activeTab === 'contest' ? (
        <>
          {/* Weekly Rewards Showcase */}
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 mb-5 shadow-2xl relative overflow-hidden text-center">
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full w-fit mx-auto mb-3">
              <Clock size={12} /> Ends In: 3 Days 14 Hours
            </div>

            <h2 className="text-base sm:text-lg font-black text-white mb-1">Top 3 Weekly GRAM Prizes</h2>
            <p className="text-[11px] text-zinc-400 mb-3">Prizes paid directly in GRAM crypto to winners' wallets</p>

            {/* Podium Cards */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 my-3">
              {/* 2nd Place */}
              <div className="bg-zinc-900/80 border border-slate-700/80 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-lg">
                <span className="text-xl mb-0.5">🥈</span>
                <span className="text-[10px] text-zinc-400 font-bold">2nd Place</span>
                <div className="flex items-center gap-1 mt-1">
                  <GramIcon size={14} />
                  <span className="text-xs sm:text-sm font-black text-slate-200">20 GRAM</span>
                </div>
                <span className="text-[9px] text-cyan-400 font-bold">(TON)</span>
              </div>

              {/* 1st Place Champion */}
              <div className="bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-2 border-amber-400 rounded-2xl p-3 flex flex-col items-center justify-between shadow-xl shadow-amber-500/10 -translate-y-1">
                <span className="text-2xl mb-0.5">🥇</span>
                <span className="text-[10px] text-amber-300 font-black">1st Place</span>
                <div className="flex items-center gap-1 mt-1">
                  <GramIcon size={18} />
                  <span className="text-sm sm:text-base font-black text-amber-300">30 GRAM</span>
                </div>
                <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider">(TON Grand)</span>
              </div>

              {/* 3rd Place */}
              <div className="bg-zinc-900/80 border border-amber-800/60 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-lg">
                <span className="text-xl mb-0.5">🥉</span>
                <span className="text-[10px] text-zinc-400 font-bold">3rd Place</span>
                <div className="flex items-center gap-1 mt-1">
                  <GramIcon size={14} />
                  <span className="text-xs sm:text-sm font-black text-amber-600">8 GRAM</span>
                </div>
                <span className="text-[9px] text-cyan-400 font-bold">(TON)</span>
              </div>
            </div>

            {/* Current User Standing */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-left mt-3">
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">Your Weekly Invites</span>
                <span className="text-xs sm:text-sm font-black text-white">{weeklyReferralCount} Friends</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-400 block font-bold">Your Current Rank</span>
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  Rank #{userRank}
                </span>
              </div>
            </div>
          </div>

          {/* Referral Link & Share Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 mb-5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 text-left">
              Your Telegram Referral Link
            </span>
            <div className="flex items-center gap-2 bg-black/60 rounded-xl p-2 sm:p-2.5 border border-zinc-800 mb-3">
              <span className="text-[11px] sm:text-xs text-blue-400 font-mono flex-1 truncate text-left dir-ltr">
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors shrink-0"
                title="Copy Link"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <Share2 size={16} />
              Share Link on Telegram
            </button>
          </div>

          {/* Live Weekly Referral Leaderboard */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-left mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame size={14} /> Weekly Contest Champions (Top 10)
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Rotates Weekly</span>
            </h3>

            {loadingLeaderboard ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading live leaderboard...</div>
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
                      <span className="text-xs font-black text-yellow-400 block">{user.weeklyReferralCount} Invites</span>
                      {user.rewardGram > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1">
                          <GramIcon size={12} />
                          {user.rewardGram} GRAM
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
                          Need {Math.max(1, (leaderboard[9]?.weeklyReferralCount || 10) - weeklyReferralCount + 1)} more invites to enter Top 10!
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-yellow-400 block">{weeklyReferralCount} Invites</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* My Referrals List Tab */
        <>
          {/* Bonus Rules Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-3.5 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-zinc-400">Regular User</span>
                <UserPlus size={16} className="text-blue-400 shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-300 block mb-1">For you & friend</span>
              <span className="text-xs sm:text-sm font-black text-yellow-400 block">+2M PlushP (200 $PLUSH)</span>
              <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded mt-1 inline-flex items-center gap-1">
                <GramIcon size={12} /> +0.005 GRAM
              </span>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 via-zinc-900 to-zinc-900 border border-purple-500/30 rounded-2xl p-3 sm:p-3.5 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                  <Star size={12} className="fill-purple-400 text-purple-400 shrink-0" /> TG Premium
                </span>
                <Sparkles size={16} className="text-purple-400 shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-purple-200 block mb-1">Premium User</span>
              <span className="text-xs sm:text-sm font-black text-purple-300 block">+10M PlushP (1K $PLUSH)</span>
              <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded mt-1 inline-flex items-center gap-1">
                <GramIcon size={12} /> +0.025 GRAM
              </span>
            </div>
          </div>

          {/* Quick Add Friend Test Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => addFriend(false)}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold py-2.5 px-2 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all"
            >
              <UserPlus size={14} className="text-blue-400" />
              Simulate Invite (+2M)
            </button>
            <button
              onClick={() => addFriend(true)}
              className="flex-1 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 font-bold py-2.5 px-2 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Star size={14} className="text-purple-400 fill-purple-400" />
              Simulate Premium (+10M)
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400">Your Referred Friends ({friends.length})</span>
            <span className="text-xs text-yellow-400 font-bold">
              Earned: {formatNumber(plushPToPlush(friends.reduce((acc, f) => acc + f.reward, 0)))} $PLUSH
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center">
              <p className="text-xs text-zinc-500">No friends have registered via your referral link yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div 
                  key={friend.id}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      friend.isPremium 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {friend.name.charAt(0)}
                    </div>
                    <div className="text-left truncate min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{friend.name}</span>
                        {friend.isPremium && (
                          <span className="bg-purple-500/20 text-purple-300 text-[8px] font-black px-1 py-0.5 rounded border border-purple-500/30 shrink-0">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate">{friend.username} • {friend.date}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-yellow-400 block">+{formatNumber(friend.reward)} PlushP</span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-[9px] text-emerald-400 font-bold">({formatNumber(plushPToPlush(friend.reward))} $PLUSH)</span>
                      <span className="text-[9px] text-cyan-300 font-black flex items-center gap-0.5 bg-cyan-500/10 px-1 rounded border border-cyan-500/20">
                        <GramIcon size={10} /> +{friend.gramReward || (friend.isPremium ? 0.025 : 0.005)} GRAM
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
