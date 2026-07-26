import React, { useState, useEffect } from 'react';
import { useAppStore, ActiveStake } from '../store/useAppStore';
import { useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { formatNumber, plushPToPlush } from '../lib/utils';
import { GramIcon } from '../components/GramIcon';
import { WithdrawalModal } from '../components/WithdrawalModal';
import { 
  Cpu, 
  Wallet, 
  Lock, 
  Clock, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Layers,
  Unlock,
  ArrowUpFromLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TARGET_TON_WALLET = 'UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3';

interface StakingPoolConfig {
  id: '1day' | '1week' | '1month' | '1year';
  name: string;
  durationDays: number;
  durationLabel: string;
  dailyRatePercent: number;
  totalReturnLabel: string;
  minDeposit: number;
  plushBonusPerGram: number; // PlushP bonus per 1 GRAM
  badge: string;
  badgeClass: string;
  gradientClass: string;
  borderClass: string;
  iconBgClass: string;
}

const STAKING_POOLS: StakingPoolConfig[] = [
  {
    id: '1day',
    name: '1-Day Flash Pool',
    durationDays: 1,
    durationLabel: '24 Hours Lock',
    dailyRatePercent: 0.5,
    totalReturnLabel: '+0.5% Return (24h)',
    minDeposit: 1.0,
    plushBonusPerGram: 10000000, // 1,000 $PLUSH
    badge: '⚡ 1-DAY FLASH',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    gradientClass: 'from-emerald-950/30 via-zinc-950 to-zinc-950',
    borderClass: 'border-emerald-500/40',
    iconBgClass: 'bg-emerald-500/20 text-emerald-400'
  },
  {
    id: '1week',
    name: '1-Week Growth Vault',
    durationDays: 7,
    durationLabel: '7 Days Lock',
    dailyRatePercent: 15 / 7, // 15% Total Return
    totalReturnLabel: '+15.0% Total Return (7d)',
    minDeposit: 1.0,
    plushBonusPerGram: 85000000, // 8,500 $PLUSH
    badge: '🚀 1-WEEK VAULT',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    gradientClass: 'from-cyan-950/30 via-zinc-950 to-zinc-950',
    borderClass: 'border-cyan-500/40',
    iconBgClass: 'bg-cyan-500/20 text-cyan-300'
  },
  {
    id: '1month',
    name: '1-Month Pro Miner Pool',
    durationDays: 30,
    durationLabel: '30 Days Lock',
    dailyRatePercent: 23 / 30, // 23% Total Return
    totalReturnLabel: '+23.0% Total Return (30d)',
    minDeposit: 1.0,
    plushBonusPerGram: 450000000, // 45,000 $PLUSH
    badge: '💎 1-MONTH PRO',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradientClass: 'from-amber-950/30 via-zinc-950 to-zinc-950',
    borderClass: 'border-amber-500/50',
    iconBgClass: 'bg-amber-500/20 text-amber-400'
  },
  {
    id: '1year',
    name: '1-Year Diamond Node',
    durationDays: 365,
    durationLabel: '365 Days Lock',
    dailyRatePercent: 33 / 365, // 33% Total Return
    totalReturnLabel: '+33.0% Total Return (365d)',
    minDeposit: 1.0,
    plushBonusPerGram: 6000000000, // 600,000 $PLUSH
    badge: '👑 1-YEAR DIAMOND',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradientClass: 'from-purple-950/30 via-zinc-950 to-zinc-950',
    borderClass: 'border-purple-500/50',
    iconBgClass: 'bg-purple-500/20 text-purple-300'
  }
];

const DYNAMIC_TELEGRAM_USERS = [
  '@alex_ton', '@maria_gram', '@pavel_v', '@ton_whale88', '@crypto_samurai',
  '@kate_staker', '@viktor_node', '@lucas_ton', '@sophia_gram', '@dmitry_v',
  '@daniil_gram', '@sergey_staker', '@mikhail_ton', '@elena_vault', '@roman_node',
  '@andrey_ton', '@anna_gram', '@max_crypto', '@igor_vault', '@denis_staker',
  '@nikita_ton', '@artem_gram', '@olga_vault', '@vlad_node', '@yulia_ton',
  '@kirill_gram', '@timur_staker', '@marat_vault', '@gleb_ton', '@pavel_gram',
  '@ruslan_node', '@egor_ton', '@anton_gram', '@vadim_staker', '@stanislav_vault',
  '@evgeny_ton', '@vitaly_gram', '@boris_node', '@semyon_ton', '@taras_gram',
  '@valery_staker', '@ilya_vault', '@robert_ton', '@daniel_gram', '@george_node',
  '@david_ton', '@alexander_gram', '@maxim_staker', '@stepan_vault', '@bogdan_ton',
  '@kirill_pro', '@andreas_ton', '@marco_italy', '@stefan_vault', '@jan_crypto',
  '@milan_ton', '@lucas_brazil', '@hassan_dubai', '@karim_ton', '@tariq_gram', '@youssef_node'
];

interface PoolActivityItem {
  username: string;
  type: 'deposit' | 'staked' | 'withdrew';
  amount: string;
  timeAgo: string;
}

function getPoolActivity(poolId: string): PoolActivityItem[] {
  // Rotate activity every 30 seconds
  const currentThirtySecBlock = Math.floor(Date.now() / 30000);
  const seedString = `${poolId}_${currentThirtySecBlock}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const userCount = DYNAMIC_TELEGRAM_USERS.length;

  const user1 = DYNAMIC_TELEGRAM_USERS[(absHash + 3) % userCount];
  const user2 = DYNAMIC_TELEGRAM_USERS[(absHash + 19) % userCount];
  const user3 = DYNAMIC_TELEGRAM_USERS[(absHash + 31) % userCount];

  // Amounts scale according to pool tier
  let amounts: string[];
  if (poolId === '1day') {
    amounts = ['1.0', '1.5', '2.0', '3.5', '5.0', '7.5'];
  } else if (poolId === '1week') {
    amounts = ['5.0', '8.5', '12.0', '20.0', '35.0', '50.0'];
  } else if (poolId === '1month') {
    amounts = ['20.0', '50.0', '85.0', '150.0', '220.0', '300.0'];
  } else {
    amounts = ['100.0', '250.0', '500.0', '1000.0', '1800.0', '2500.0'];
  }

  return [
    {
      username: user1,
      type: 'staked',
      amount: amounts[(absHash + 2) % amounts.length],
      timeAgo: `${((absHash % 20) + 5)}s ago`
    },
    {
      username: user2,
      type: 'withdrew',
      amount: amounts[(absHash + 5) % amounts.length],
      timeAgo: `${((absHash % 15) + 2)}s ago`
    },
    {
      username: user3,
      type: 'deposit',
      amount: amounts[(absHash + 8) % amounts.length],
      timeAgo: `${((absHash % 25) + 1)}s ago`
    }
  ];
}

export function Home() {
  const { 
    depositedGramBalance, 
    gramBalance, 
    balance, 
    activeStakes, 
    depositGram, 
    createStakePool, 
    claimStakeYield,
    unstakePool 
  } = useAppStore();

  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const [depositAmount, setDepositAmount] = useState<string>('0.5');
  const [selectedPool, setSelectedPool] = useState<StakingPoolConfig | null>(null);
  const [stakeAmountInput, setStakeAmountInput] = useState<string>('');

  const [isDepositing, setIsDepositing] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [claimingStakeId, setClaimingStakeId] = useState<string | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live timer tick for active stakes countdowns
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'Unlocked';
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / (24 * 3600));
    const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // TON Deposit Handler via TonConnect
  const handleDepositTON = async () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setIsDepositing(true);
    setErrorMsg(null);

    if (!wallet) {
      try {
        await tonConnectUI.openModal();
      } catch (e) {
        console.error(e);
      }
      setIsDepositing(false);
      return;
    }

    try {
      const nanoTon = Math.floor(val * 1_000_000_000).toString();
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: TARGET_TON_WALLET,
            amount: nanoTon,
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);

      // Successfully transferred on TON blockchain!
      await depositGram(val);
      setSuccessMsg(`Deposit Successful! +${val} GRAM added to your wallet balance.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('TonConnect Deposit Error:', err);
      setErrorMsg('Transaction was canceled or rejected by your TON wallet.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsDepositing(false);
    }
  };

  // Open Staking Modal for a Pool
  const handleOpenStakeModal = (pool: StakingPoolConfig) => {
    setSelectedPool(pool);
    setStakeAmountInput(Math.max(pool.minDeposit, gramBalance > 0 ? gramBalance : pool.minDeposit).toString());
  };

  // Execute Staking into Selected Pool
  const handleConfirmStake = async () => {
    if (!selectedPool) return;
    const amount = parseFloat(stakeAmountInput);
    if (isNaN(amount) || amount < selectedPool.minDeposit) {
      setErrorMsg(`Minimum deposit for ${selectedPool.name} is ${selectedPool.minDeposit} GRAM.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (gramBalance < amount) {
      setErrorMsg(`Insufficient balance. You need ${amount} GRAM. Please deposit TON first.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setIsStaking(true);
    const plushBonus = Math.floor(amount * selectedPool.plushBonusPerGram);

    const success = await createStakePool(
      selectedPool.id,
      selectedPool.name,
      amount,
      selectedPool.durationDays,
      selectedPool.dailyRatePercent,
      plushBonus
    );

    setIsStaking(false);

    if (success) {
      setSuccessMsg(`Successfully locked ${amount} GRAM into ${selectedPool.name}!`);
      setSelectedPool(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg('Failed to lock stake into pool.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Claim Yield or Unstake Completed Stake
  const handleClaimYield = async (stake: ActiveStake) => {
    setClaimingStakeId(stake.id);
    const now = Date.now();
    const isUnlocked = now >= stake.endTime;

    if (isUnlocked) {
      const ok = await unstakePool(stake.id);
      setClaimingStakeId(null);
      if (ok) {
        setSuccessMsg(`Stake unlocked! Principal + Yield returned to your GRAM balance.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg('Failed to unlock stake.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
      return;
    }

    const res = await claimStakeYield(stake.id);
    setClaimingStakeId(null);

    if (res.gramYield > 0 || res.plushYield > 0) {
      setSuccessMsg(`Yield Claimed! +${res.gramYield} GRAM & +${formatNumber(plushPToPlush(res.plushYield))} $PLUSH added to wallet.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg('No accumulated yield available to claim yet.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const totalActiveStakedGram = activeStakes.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="flex flex-col items-center flex-1 w-full max-w-lg mx-auto px-4 sm:px-5 pt-5 sm:pt-7 pb-28 relative min-h-screen text-white">
      
      {/* Top Title Section */}
      <div className="text-center mb-5 w-full">
        <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/20 via-amber-500/20 to-emerald-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
          <TrendingUp size={28} className="text-cyan-300" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">GRAM Pool & Staking Vaults</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto leading-relaxed">
          Deposit <strong className="text-cyan-300">GRAM (TON)</strong> via TonConnect & lock into Staking Pools for high yield!
        </p>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-4 bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border border-emerald-500/50 text-emerald-300 p-3.5 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xl"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-4 bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border border-red-500/50 text-red-300 p-3.5 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xl"
          >
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Balance Dashboard Card */}
      <div className="w-full mb-6 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Wallet & Vault Balances
          </span>
          <TonConnectButton className="ton-connect-button-sm scale-90 origin-right" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Total GRAM Balance */}
          <div className="bg-zinc-900/90 border border-cyan-500/30 p-3 rounded-2xl flex flex-col justify-between">
            <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 mb-1">
              <GramIcon size={14} />
              <span className="truncate">Total GRAM Balance</span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight">
                {gramBalance.toFixed(3)} <span className="text-xs font-bold text-cyan-400">GRAM</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                Total (Referrals + Deposits)
              </div>
            </div>
          </div>

          {/* Staked Active Balance */}
          <div className="bg-zinc-900/90 border border-amber-500/30 p-3 rounded-2xl flex flex-col justify-between">
            <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 mb-1">
              <Lock size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">Active Locked</span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                {totalActiveStakedGram.toFixed(3)} <span className="text-xs font-bold text-amber-300">GRAM</span>
              </div>
              <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
                {activeStakes.length} Active Vaults
              </div>
            </div>
          </div>
        </div>

        {/* $PLUSH Wallet Balance & Withdraw Button */}
        <div className="space-y-2">
          <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5">
              <Coins size={14} className="text-yellow-400" />
              $PLUSH Balance
            </span>
            <span className="font-black text-yellow-400">
              {formatNumber(plushPToPlush(balance))} $PLUSH
            </span>
          </div>

          {/* Prominent Withdrawal Button (زر السحب) */}
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 active:scale-95 text-black font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <ArrowUpFromLine size={16} className="text-black" />
            <span>Withdraw GRAM / $PLUSH</span>
          </button>
        </div>
      </div>

      {/* TonConnect Automatic Payment Box */}
      <div className="w-full mb-6 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-emerald-500/40 p-4 sm:p-5 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-black text-sm text-white">Deposit GRAM (TON) via TonConnect</h3>
            <p className="text-[11px] text-zinc-400">Transfer TON from your wallet directly to credit your GRAM balance.</p>
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {['0.1', '0.5', '1.0', '5.0'].map((val) => (
            <button
              key={val}
              onClick={() => setDepositAmount(val)}
              className={`py-1.5 rounded-xl font-bold text-xs transition-all border ${
                depositAmount === val
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {val} TON
            </button>
          ))}
        </div>

        {/* Input & Action */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-400 rounded-2xl px-3 py-2.5 text-sm font-black text-white focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">TON</span>
          </div>

          <button
            disabled={isDepositing}
            onClick={handleDepositTON}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-95 text-black font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 shrink-0 flex items-center gap-1.5"
          >
            {isDepositing ? (
              <span>Processing...</span>
            ) : (
              <>
                <Zap size={16} className="fill-black" />
                <span>Deposit TON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STAKING POOLS HEADER */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Layers size={18} className="text-amber-400" />
          Select Staking Pool (1D, 1W, 1M, 1Y)
        </h2>
        <span className="text-[10px] font-bold text-zinc-400">Locked Staking</span>
      </div>

      {/* STAKING POOLS LIST */}
      <div className="w-full space-y-4 mb-8">
        {STAKING_POOLS.map((pool) => {
          const poolActivities = getPoolActivity(pool.id);

          return (
            <div
              key={pool.id}
              className={`bg-gradient-to-b ${pool.gradientClass} border-2 ${pool.borderClass} p-4 sm:p-5 rounded-3xl relative overflow-hidden shadow-xl transition-all`}
            >
              {/* Badge & Duration */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${pool.badgeClass}`}>
                  <Sparkles size={11} /> {pool.badge}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Clock size={11} className="text-cyan-400" /> {pool.durationLabel}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-black text-lg text-white mb-1">{pool.name}</h3>

              {/* Yield Breakdown with Premium Metallic Glowing GRAM Logo Frame */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Metallic Glowing Border Frame for GRAM */}
                  <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-950 via-zinc-900 to-cyan-900 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 shrink-0 flex items-center justify-center">
                    <div className="absolute -inset-0.5 bg-cyan-400/20 rounded-2xl blur-sm" />
                    <GramIcon size={22} className="relative z-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">Staking Return</span>
                    <span className="text-xs sm:text-sm font-black text-cyan-300">
                      {pool.totalReturnLabel}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3 border-l border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-medium">Plush Bonus / GRAM</span>
                  <span className="text-xs sm:text-sm font-black text-yellow-400">
                    +{formatNumber(plushPToPlush(pool.plushBonusPerGram))} $PLUSH
                  </span>
                </div>
              </div>

              {/* Live Deposit & Withdrawal Activity Stream */}
              <div className="mb-3 bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] px-0.5">
                  <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Pool Activity
                  </span>
                </div>

                <div className="space-y-1">
                  {poolActivities.slice(0, 2).map((act, idx) => (
                    <div key={idx} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-zinc-300 truncate">{act.username}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          act.type === 'deposit' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : act.type === 'staked'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {act.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-black text-white">{act.amount} GRAM</span>
                        <span className="text-[9px] text-zinc-500">{act.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleOpenStakeModal(pool)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Lock size={16} className="fill-black" />
                <span>Stake Into {pool.name}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ACTIVE STAKES SECTION */}
      {activeStakes.length > 0 && (
        <div className="w-full space-y-3 border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
            <Lock size={16} className="text-emerald-400" />
            Your Active Vault Stakes ({activeStakes.length})
          </h3>

          <div className="space-y-3">
            {activeStakes.map((stake) => {
              const now = Date.now();
              const timeRemaining = Math.max(0, stake.endTime - now);
              const isUnlocked = timeRemaining <= 0;
              const elapsedMs = Math.max(0, now - stake.lastClaimTime);
              const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);
              const pendingGramYield = Math.round((stake.amount * (stake.dailyRatePercent / 100) * elapsedDays) * 10000) / 10000;
              const isClaimingThis = claimingStakeId === stake.id;

              return (
                <div
                  key={stake.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs text-white">{stake.poolName}</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Staked: {stake.amount} GRAM
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Pending Yield</span>
                      <span className="font-black text-cyan-300">+{pendingGramYield} GRAM</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Lock Countdown</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {isUnlocked ? 'Unlocked & Ready' : formatCountdown(timeRemaining)}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isClaimingThis}
                    onClick={() => handleClaimYield(stake)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:brightness-110'
                    }`}
                  >
                    {isClaimingThis ? (
                      <span>Processing...</span>
                    ) : isUnlocked ? (
                      <>
                        <Unlock size={14} className="fill-black" />
                        <span>Unlock Principal & Collect Yield</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} className="fill-black" />
                        <span>Claim Yield (+{pendingGramYield} GRAM)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAKING MODAL */}
      <AnimatePresence>
        {selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-amber-500/50 rounded-3xl p-5 shadow-2xl text-white text-left"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                <div>
                  <h3 className="font-black text-base text-white">{selectedPool.name}</h3>
                  <span className="text-[10px] font-bold text-amber-400">{selectedPool.durationLabel}</span>
                </div>
                <button
                  onClick={() => setSelectedPool(null)}
                  className="p-1.5 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4">
                Lock your GRAM into this pool for <strong className="text-white">{selectedPool.durationLabel}</strong> to earn <strong className="text-cyan-300">+{selectedPool.dailyRatePercent}% daily yield</strong>.
              </p>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Amount to Stake (GRAM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={selectedPool.minDeposit}
                    value={stakeAmountInput}
                    onChange={(e) => setStakeAmountInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-2xl px-3 py-2.5 text-sm font-black text-white focus:outline-none"
                  />
                  <button
                    onClick={() => setStakeAmountInput(Math.max(selectedPool.minDeposit, gramBalance).toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/30"
                  >
                    MAX
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Available GRAM balance: {gramBalance.toFixed(3)} GRAM
                </span>
              </div>

              {/* Yield Calculation Summary */}
              {(() => {
                const amt = parseFloat(stakeAmountInput) || 0;
                const dailyGram = (amt * (selectedPool.dailyRatePercent / 100));
                const totalGramYield = dailyGram * selectedPool.durationDays;
                const totalPlushBonus = amt * selectedPool.plushBonusPerGram;

                return (
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 mb-5 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Lock Period:</span>
                      <span className="font-bold text-white">{selectedPool.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Total GRAM Yield:</span>
                      <span className="font-black text-cyan-300">+{totalGramYield.toFixed(3)} GRAM</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>$PLUSH Token Bonus:</span>
                      <span className="font-black text-yellow-400">+{formatNumber(plushPToPlush(totalPlushBonus))} $PLUSH</span>
                    </div>
                  </div>
                );
              })()}

              <button
                disabled={isStaking}
                onClick={handleConfirmStake}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-black font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {isStaking ? (
                  <span>Locking Stake...</span>
                ) : (
                  <>
                    <Lock size={16} className="fill-black" />
                    <span>Confirm Lock & Start Staking</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WITHDRAWAL MODAL */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
}
