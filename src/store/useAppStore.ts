import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncUserProfile, getUserReferrals, db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export interface ReferredFriend {
  id: string;
  name: string;
  username: string;
  isPremium: boolean;
  reward: number;
  gramReward?: number;
  date: string;
}

export interface Season1Stats {
  minedTokens: number;
  rank: number;
  tier: string;
  estimatedAllocation: number;
  claimedBonus: boolean;
}

export interface ActiveStake {
  id: string;
  poolId: '1day' | '1week' | '1month' | '1year';
  poolName: string;
  amount: number; // in TON/GRAM
  dailyRatePercent: number; // e.g. 5%
  plushBonus: number;
  startTime: number;
  endTime: number;
  lastClaimTime: number;
  totalClaimedYield: number;
}

interface AppState {
  userId: string | null;
  username?: string;
  balance: number; // $PLUSH
  gramBalance: number; // GRAM
  lastMiningTime: number | null; // 4-hour cycle
  miningDurationMs: number; // 4 * 60 * 60 * 1000
  tasksCompleted: string[];
  friends: ReferredFriend[];
  weeklyReferralCount: number;
  season1Stats: Season1Stats;
  dailyStreak: number;
  lastCheckInDate: string | null;
  walletAddress: string;
  userMiningCards: Record<string, { lastClaimTime: number; purchased?: boolean }>;
  depositedGramBalance: number;
  activeStakes: ActiveStake[];
  isLoading: boolean;
  welcomeBonusInfo?: { plushP: number; gram: number; referrerName: string } | null;

  // Actions
  initUser: (tgUser?: any, refCode?: string | null) => Promise<void>;
  dismissWelcomeBonus: () => void;
  startMining: () => Promise<void>;
  collectMining: (amount: number) => Promise<void>;
  completeTask: (taskId: string, reward: number) => Promise<void>;
  addBalance: (amount: number) => Promise<void>;
  addGramBalance: (amount: number) => Promise<void>;
  addFriend: (isPremium?: boolean) => Promise<void>;
  claimSeason1Bonus: () => Promise<void>;
  claimDailyCheckIn: () => Promise<number>;
  claimCardReward: (cardId: string, gramReward: number, plushReward?: number) => Promise<boolean>;
  purchaseCard: (cardId: string) => Promise<void>;
  depositGram: (amount: number) => Promise<void>;
  createStakePool: (
    poolId: '1day' | '1week' | '1month' | '1year',
    poolName: string,
    amount: number,
    durationDays: number,
    dailyRatePercent: number,
    plushBonus: number
  ) => Promise<boolean>;
  claimStakeYield: (stakeId: string) => Promise<{ gramYield: number; plushYield: number }>;
  unstakePool: (stakeId: string) => Promise<boolean>;
  setWalletAddress: (address: string) => Promise<void>;
  withdrawFunds: (currency: 'PLUSH' | 'GRAM', amount: number) => Promise<boolean>;
  resetState: () => void;
}

export const FOUR_HOURS_MS = 4 * 60 * 60 * 1000; // 4 hours in ms

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: '',
      balance: 10000000, // Default 10M PlushP (1,000 $PLUSH)
      gramBalance: 0.5, // Default 0.5 GRAM welcome bonus
      lastMiningTime: null,
      miningDurationMs: FOUR_HOURS_MS,
      tasksCompleted: [],
      friends: [],
      weeklyReferralCount: 0,
      season1Stats: {
        minedTokens: 145000000,
        rank: 312,
        tier: '🏆 Diamond Plush Tier',
        estimatedAllocation: 145000000,
        claimedBonus: false
      },
      dailyStreak: 1,
      lastCheckInDate: null,
      walletAddress: '',
      userMiningCards: {},
      depositedGramBalance: 0,
      activeStakes: [],
      isLoading: false,
      welcomeBonusInfo: null,

      initUser: async (tgUser?: any, refCode?: string | null) => {
        set({ isLoading: true });
        try {
          const { userDoc, uid } = await syncUserProfile(tgUser, refCode);
          const realReferrals = await getUserReferrals(uid);
          set((state) => ({
            userId: uid,
            username: userDoc.username || (tgUser?.username ? `@${tgUser.username}` : ''),
            balance: userDoc.balance ?? 0,
            gramBalance: userDoc.gramBalance ?? 0.5,
            lastMiningTime: userDoc.lastMiningStartTime ?? null,
            tasksCompleted: userDoc.tasksCompleted ?? [],
            weeklyReferralCount: userDoc.weeklyReferralCount ?? 0,
            friends: realReferrals.length > 0 ? realReferrals : state.friends,
            walletAddress: userDoc.walletAddress ?? '',
            season1Stats: {
              minedTokens: userDoc.season1MinedTokens ?? 1450000,
              rank: userDoc.season1Rank ?? 312,
              tier: userDoc.season1Tier ?? '🏆 Diamond Plush Tier',
              estimatedAllocation: userDoc.season1Allocation ?? 14500,
              claimedBonus: userDoc.season1Claimed ?? false
            },
            dailyStreak: userDoc.dailyStreak ?? 1,
            lastCheckInDate: userDoc.lastCheckInDate ?? null,
            userMiningCards: userDoc.userMiningCards ?? state.userMiningCards ?? {},
            depositedGramBalance: userDoc.depositedGramBalance ?? state.depositedGramBalance ?? 0,
            activeStakes: userDoc.activeStakes ?? state.activeStakes ?? [],
            welcomeBonusInfo: userDoc.welcomeReferralBonus || state.welcomeBonusInfo || null,
            isLoading: false
          }));
        } catch (err) {
          console.error("Firebase sync error:", err);
          set({ isLoading: false });
        }
      },

      dismissWelcomeBonus: () => {
        set({ welcomeBonusInfo: null });
      },

      startMining: async () => {
        const now = Date.now();
        set({ lastMiningTime: now });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        const uid = get().userId;
        if (uid) {
          try {
            await updateDoc(doc(db, 'users', uid), { lastMiningStartTime: now });
          } catch (e) {
            console.error("Failed to update mining in DB:", e);
          }
        }
      },

      collectMining: async (amount: number) => {
        const state = get();
        const newBalance = state.balance + amount;
        set({
          balance: newBalance,
          lastMiningTime: null
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              balance: increment(amount),
              lastMiningStartTime: null
            });
          } catch (e) {
            console.error("Failed to collect mining in DB:", e);
          }
        }
      },

      completeTask: async (taskId: string, reward: number) => {
        const state = get();
        if (state.tasksCompleted.includes(taskId)) return;

        const newTasks = [...state.tasksCompleted, taskId];
        const newBalance = state.balance + reward;
        set({
          balance: newBalance,
          tasksCompleted: newTasks
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              balance: increment(reward),
              tasksCompleted: newTasks
            });
          } catch (e) {
            console.error("Failed to save completed task:", e);
          }
        }
      },

      addBalance: async (amount: number) => {
        const state = get();
        const newBal = state.balance + amount;
        set({ balance: newBal });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), { balance: increment(amount) });
          } catch (e) {
            console.error("Failed to update balance:", e);
          }
        }
      },

      addFriend: async (isPremium = false) => {
        const reward = isPremium ? 10000000 : 2000000;
        const gramReward = isPremium ? 0.025 : 0.005;
        const newFriend: ReferredFriend = {
          id: 'ref-' + Date.now(),
          name: isPremium ? 'Telegram Premium User' : 'New Referred Friend',
          username: `@user_${Math.floor(1000 + Math.random() * 9000)}`,
          isPremium,
          reward,
          gramReward,
          date: 'Just now'
        };

        const state = get();
        set((s) => ({
          balance: s.balance + reward,
          gramBalance: Math.round((s.gramBalance + gramReward) * 10000) / 10000,
          weeklyReferralCount: s.weeklyReferralCount + 1,
          friends: [newFriend, ...s.friends]
        }));

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              balance: increment(reward),
              gramBalance: increment(gramReward),
              weeklyReferralCount: increment(1),
              totalReferrals: increment(1)
            });
          } catch (e) {
            console.error("Failed to add friend in DB:", e);
          }
        }
      },

      claimSeason1Bonus: async () => {
        const state = get();
        if (state.season1Stats.claimedBonus) return;

        set((s) => ({
          balance: s.balance + 50000000,
          season1Stats: {
            ...s.season1Stats,
            claimedBonus: true
          }
        }));

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              balance: increment(50000000),
              season1Claimed: true
            });
          } catch (e) {
            console.error("Failed to claim Season 1 bonus in DB:", e);
          }
        }
      },

      claimDailyCheckIn: async () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        if (state.lastCheckInDate === today) return 0;

        const reward = (state.dailyStreak + 1) * 1000000;
        const newStreak = (state.dailyStreak % 7) + 1;

        set((s) => ({
          balance: s.balance + reward,
          dailyStreak: newStreak,
          lastCheckInDate: today
        }));

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              balance: increment(reward),
              dailyStreak: newStreak,
              lastCheckInDate: today
            });
          } catch (e) {
            console.error("Failed to save check-in:", e);
          }
        }

        return reward;
      },

      addGramBalance: async (amount: number) => {
        const state = get();
        const newBal = state.gramBalance + amount;
        set({ gramBalance: Math.round(newBal * 10000) / 10000 });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), { gramBalance: increment(amount) });
          } catch (e) {
            console.error("Failed to update gram balance:", e);
          }
        }
      },

      claimCardReward: async (cardId: string, gramReward: number, plushReward = 0) => {
        const state = get();
        const now = Date.now();
        const cardState = state.userMiningCards[cardId] || { lastClaimTime: 0, purchased: false };

        const newCards = {
          ...state.userMiningCards,
          [cardId]: {
            ...cardState,
            lastClaimTime: now
          }
        };

        const newGram = Math.round((state.gramBalance + gramReward) * 10000) / 10000;
        const newPlush = state.balance + plushReward;

        set({
          userMiningCards: newCards,
          gramBalance: newGram,
          balance: newPlush
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              gramBalance: increment(gramReward),
              balance: increment(plushReward),
              userMiningCards: newCards
            });
          } catch (e) {
            console.error("Failed to save card claim to DB:", e);
          }
        }

        return true;
      },

      purchaseCard: async (cardId: string) => {
        const state = get();
        const now = Date.now();
        const cardState = state.userMiningCards[cardId] || { lastClaimTime: 0, purchased: false };

        const newCards = {
          ...state.userMiningCards,
          [cardId]: {
            ...cardState,
            purchased: true,
            lastClaimTime: cardState.lastClaimTime || now
          }
        };

        set({ userMiningCards: newCards });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              userMiningCards: newCards
            });
          } catch (e) {
            console.error("Failed to save card purchase to DB:", e);
          }
        }
      },

      depositGram: async (amount: number) => {
        const state = get();
        const newDep = Math.round((state.depositedGramBalance + amount) * 10000) / 10000;
        const newGram = Math.round((state.gramBalance + amount) * 10000) / 10000;
        
        set({
          depositedGramBalance: newDep,
          gramBalance: newGram
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              depositedGramBalance: increment(amount),
              gramBalance: increment(amount)
            });
          } catch (e) {
            console.error("Failed to record deposit to DB:", e);
          }
        }
      },

      createStakePool: async (poolId, poolName, amount, durationDays, dailyRatePercent, plushBonus) => {
        const state = get();
        if (state.gramBalance < amount && state.depositedGramBalance < amount) {
          return false;
        }

        const now = Date.now();
        const newStake: ActiveStake = {
          id: `stake_${now}_${Math.random().toString(36).substring(2, 7)}`,
          poolId,
          poolName,
          amount,
          dailyRatePercent,
          plushBonus,
          startTime: now,
          endTime: now + durationDays * 24 * 60 * 60 * 1000,
          lastClaimTime: now,
          totalClaimedYield: 0
        };

        const updatedStakes = [newStake, ...state.activeStakes];
        const newDep = Math.max(0, Math.round((state.depositedGramBalance - amount) * 10000) / 10000);
        const newGram = Math.max(0, Math.round((state.gramBalance - amount) * 10000) / 10000);

        set({
          activeStakes: updatedStakes,
          depositedGramBalance: newDep,
          gramBalance: newGram
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              activeStakes: updatedStakes,
              depositedGramBalance: newDep,
              gramBalance: increment(-amount)
            });
          } catch (e) {
            console.error("Failed to save stake to DB:", e);
          }
        }

        return true;
      },

      unstakePool: async (stakeId: string) => {
        const state = get();
        const stake = state.activeStakes.find(s => s.id === stakeId);
        if (!stake) return false;

        const now = Date.now();
        if (now < stake.endTime) {
          return false;
        }

        const elapsedMs = Math.max(0, stake.endTime - stake.lastClaimTime);
        const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);
        const finalGramYield = Math.round((stake.amount * (stake.dailyRatePercent / 100) * elapsedDays) * 10000) / 10000;

        const totalReturned = Math.round((stake.amount + finalGramYield) * 10000) / 10000;
        const updatedStakes = state.activeStakes.filter(s => s.id !== stakeId);
        const newGram = Math.round((state.gramBalance + totalReturned) * 10000) / 10000;

        set({
          activeStakes: updatedStakes,
          gramBalance: newGram
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              activeStakes: updatedStakes,
              gramBalance: increment(totalReturned)
            });
          } catch (e) {
            console.error("Failed to unlock stake in DB:", e);
          }
        }

        return true;
      },

      claimStakeYield: async (stakeId: string) => {
        const state = get();
        const stake = state.activeStakes.find(s => s.id === stakeId);
        if (!stake) return { gramYield: 0, plushYield: 0 };

        const now = Date.now();
        const elapsedMs = Math.max(0, now - stake.lastClaimTime);
        const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);

        const gramYield = Math.round((stake.amount * (stake.dailyRatePercent / 100) * elapsedDays) * 10000) / 10000;
        const totalDurationDays = (stake.endTime - stake.startTime) / (24 * 60 * 60 * 1000);
        const plushYield = Math.floor(stake.plushBonus * Math.min(1, elapsedDays / totalDurationDays));

        if (gramYield <= 0 && plushYield <= 0) {
          return { gramYield: 0, plushYield: 0 };
        }

        const updatedStakes = state.activeStakes.map(s => {
          if (s.id === stakeId) {
            return {
              ...s,
              lastClaimTime: now,
              totalClaimedYield: Math.round((s.totalClaimedYield + gramYield) * 10000) / 10000
            };
          }
          return s;
        });

        const newGram = Math.round((state.gramBalance + gramYield) * 10000) / 10000;
        const newPlush = state.balance + plushYield;

        set({
          activeStakes: updatedStakes,
          gramBalance: newGram,
          balance: newPlush
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), {
              activeStakes: updatedStakes,
              gramBalance: increment(gramYield),
              balance: increment(plushYield)
            });
          } catch (e) {
            console.error("Failed to save stake yield claim to DB:", e);
          }
        }

        return { gramYield, plushYield };
      },

      setWalletAddress: async (address: string) => {
        const state = get();
        set({ walletAddress: address });

        if (state.userId) {
          try {
            await updateDoc(doc(db, 'users', state.userId), { walletAddress: address });
          } catch (e) {
            console.error("Failed to update wallet address in DB:", e);
          }
        }
      },

      withdrawFunds: async (currency: 'PLUSH' | 'GRAM', amount: number) => {
        const state = get();
        if (currency === 'PLUSH') {
          if (state.balance < amount) return false;
          const newBal = state.balance - amount;
          set({ balance: newBal });
          if (state.userId) {
            try {
              await updateDoc(doc(db, 'users', state.userId), { balance: increment(-amount) });
            } catch (e) {
              console.error("Failed to update balance on withdrawal:", e);
            }
          }
        } else {
          if (state.gramBalance < amount) return false;
          const newBal = state.gramBalance - amount;
          set({ gramBalance: newBal });
          if (state.userId) {
            try {
              await updateDoc(doc(db, 'users', state.userId), { gramBalance: increment(-amount) });
            } catch (e) {
              console.error("Failed to update gram balance on withdrawal:", e);
            }
          }
        }

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        return true;
      },

      resetState: () => {
        set({
          userId: null,
          balance: 0,
          gramBalance: 10.0,
          lastMiningTime: null,
          tasksCompleted: [],
          friends: [],
          weeklyReferralCount: 0,
          season1Stats: {
            minedTokens: 1450000,
            rank: 312,
            tier: '🏆 Diamond Plush Tier',
            estimatedAllocation: 14500,
            claimedBonus: false
          },
          dailyStreak: 1,
          lastCheckInDate: null,
          walletAddress: ''
        });
      }
    }),
    {
      name: 'plush-pepe-tap-v5',
    }
  )
);
