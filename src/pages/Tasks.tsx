import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Coins, Tv, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { GramIcon } from '../components/GramIcon';
import { formatNumber, plushPToPlush } from '../lib/utils';

interface AdBlockConfig {
  id: string;
  title: string;
  subtitle: string;
  plushP: number;
  badge: string;
  gradientClass: string;
  borderClass: string;
  badgeClass: string;
}

const ADSGRAM_BLOCKS: AdBlockConfig[] = [
  {
    id: "int-35086",
    title: "Standard Adsgram Video Stream",
    subtitle: "Official Adsgram rewarded video stream",
    plushP: 10000000, // 1,000 $PLUSH
    badge: "Official Stream",
    gradientClass: "from-orange-500/10 via-amber-500/5 to-zinc-950",
    borderClass: "border-orange-500/40",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  },
  {
    id: "int-35088",
    title: "Adsgram Gold Super Stream",
    subtitle: "High reward Adsgram video stream",
    plushP: 20000000, // 2,000 $PLUSH
    badge: "Super Stream",
    gradientClass: "from-purple-900/20 via-amber-500/10 to-zinc-950",
    borderClass: "border-purple-500/40",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  {
    id: "int-35089",
    title: "Adsgram Express Speed Ad",
    subtitle: "Fast boost Adsgram video stream",
    plushP: 15000000, // 1,500 $PLUSH
    badge: "Express Stream",
    gradientClass: "from-cyan-500/10 via-emerald-500/5 to-zinc-950",
    borderClass: "border-cyan-500/40",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  }
];

export function Tasks() {
  const { addBalance } = useAppStore();
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [rewardBanner, setRewardBanner] = useState<{ plushP: number; blockId: string } | null>(null);

  const handleWatchAd = async (block: AdBlockConfig) => {
    if (activeAdId) return;
    setActiveAdId(block.id);

    const grantReward = () => {
      addBalance(block.plushP);
      setRewardBanner({ plushP: block.plushP, blockId: block.id });
      setTimeout(() => setRewardBanner(null), 5000);
    };

    if (window.Adsgram) {
      try {
        const AdController = window.Adsgram.init({ blockId: block.id });
        await AdController.show();
        grantReward();
      } catch (e) {
        console.log(`Adsgram block ${block.id} fallback`, e);
        grantReward();
      } finally {
        setActiveAdId(null);
      }
    } else {
      setTimeout(() => {
        grantReward();
        setActiveAdId(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-lg mx-auto px-4 sm:px-5 pt-6 sm:pt-8 pb-28">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-yellow-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
          <Tv size={28} className="text-orange-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Watch Ads & Earn $PLUSH</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto leading-relaxed">
          Watch short video ads to claim instant <strong className="text-yellow-400">$PLUSH</strong> token rewards!
        </p>
      </div>

      {/* Reward Success Banner */}
      {rewardBanner && (
        <div className="mb-5 bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl text-center text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <CheckCircle2 size={18} />
            <span>Ad Reward Successfully Claimed!</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-yellow-400 font-black text-sm">+{formatNumber(plushPToPlush(rewardBanner.plushP))} $PLUSH Tokens</span>
          </div>
        </div>
      )}

      {/* Adsgram Video Ad Cards */}
      <div className="space-y-4">
        {ADSGRAM_BLOCKS.map((block) => {
          const isLoadingThis = activeAdId === block.id;

          return (
            <div
              key={block.id}
              className={`bg-gradient-to-b ${block.gradientClass} border-2 ${block.borderClass} p-5 rounded-3xl relative overflow-hidden shadow-xl transition-all`}
            >
              {/* Badge Header */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${block.badgeClass}`}>
                  <Sparkles size={11} /> {block.badge}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-black text-base text-white mb-1">{block.title}</h3>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">{block.subtitle}</p>

              {/* Reward Highlights */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-yellow-500/10 p-2 rounded-xl text-yellow-400 shrink-0">
                    <Coins size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block font-medium">$PLUSH Reward</span>
                    <span className="text-xs sm:text-sm font-black text-yellow-400">
                      +{formatNumber(plushPToPlush(block.plushP))} $PLUSH
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg">
                    Instant Credit
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={activeAdId !== null}
                onClick={() => handleWatchAd(block)}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLoadingThis
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700 cursor-wait'
                    : activeAdId
                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-black hover:brightness-110 active:scale-95 shadow-orange-500/20'
                }`}
              >
                {isLoadingThis ? (
                  <>
                    <Tv size={16} className="animate-pulse text-amber-400" />
                    <span>Loading Video Ad ({block.id})...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-black" />
                    <span>Watch Video & Claim Reward</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
