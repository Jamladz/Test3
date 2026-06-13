import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, GameService } from '../services/api';

interface GameState {
  balance: number;
  energy: number;
  maxEnergy: number;
  profitPerHour: number;
  tapMultiplier: number;
  lastLogin: number;
  role: string;
  addBalance: (amount: number) => void;
  reduceEnergy: (amount: number) => boolean;
  increaseEnergy: (amount: number) => void;
  buyUpgrade: (cost: number, profitIncrease: number) => boolean;
  updateFromOffline: () => void;
  fetchUser: (userId: string, username: string, firstName: string, startParam?: string, initData?: string) => Promise<void>;
  sync: () => Promise<void>;
  userId: string;
  firebaseUid: string;
  username: string;
  upgrades: Record<string, number>;
  missions: string[];
  friendsCount: number;
  adsWatched: number;
  cooldowns: Record<string, number>;
  incrementAdsWatched: () => void;
  incrementFriends: () => void;
  setCooldown: (id: string, time: number) => void;
  buyUpgradeApi: (upgradeId: string, cost: number, profitInc: number) => Promise<void>;
  completeMissionApi: (missionId: string, reward: number) => Promise<void>;
  offlineEarnings: number;
  claimOfflineEarnings: () => void;
  justReferred: boolean;
  clearJustReferred: () => void;
  syncedBalance: number;
  spinsLeft: number;
  lastSpinReset: number;
  totalSpins: number;
  gramBalance: number;
  gramMiningRate: number; // rate per day
  lastGramSync: number;
  gramMiningActiveUntil: number;
  tonBalance: number;
  tonMiningRate: number;
  lastTonSync: number;
  tonMiningActiveUntil: number;
  tonAdsWatchedDaily: number;
  lastTonAdReset: number;
  withdrawals: any[];
  requestWithdrawal: (tokenAmount: number, coinCost: number, wallet: string) => Promise<void>;
  hasClaimedPlushAirdrop: boolean;
  claimPlushAirdrop: () => Promise<void>;
  useSpin: () => void;
  checkSpinReset: () => void;
  upgradeGramMining: (amount: number) => void;
  syncGramMining: () => void;
  startGramMining: () => void;
  upgradeTonMiningViaAds: () => void;
  syncTonMining: () => void;
  startTonMining: () => void;
  buyTonPackage: (amount: number, multiplier: number) => void;
  gifts: string[];
  addGift: (img: string) => Promise<void>;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  balance: 0,
  syncedBalance: 0,
  energy: 1500,
  maxEnergy: 1500,
  profitPerHour: 0,
  tapMultiplier: 10,
  lastLogin: Date.now(),
  role: 'user',
  userId: '',
  firebaseUid: '',
  username: '',
  upgrades: {},
  missions: [],
  friendsCount: 0,
  adsWatched: 0,
  cooldowns: {},
  offlineEarnings: 0,
  justReferred: false,
  spinsLeft: 3,
  lastSpinReset: Date.now(),
  totalSpins: 0,
  gramBalance: 0,
  gramMiningRate: 0.0001,
  lastGramSync: Date.now(),
  gramMiningActiveUntil: 0,
  tonBalance: 0,
  tonMiningRate: 0.001,
  lastTonSync: Date.now(),
  tonMiningActiveUntil: 0,
  tonAdsWatchedDaily: 0,
  lastTonAdReset: Date.now(),
  withdrawals: [],
  hasClaimedPlushAirdrop: false,
  gifts: [],

  addGift: async (img: string) => {
    const state = get();
    if (!state.firebaseUid) return;
    try {
      const newGifts = [...state.gifts, img];
      await GameService.syncState(state.firebaseUid, {
          gifts: newGifts
      });
      set({ gifts: newGifts });
    } catch(e) {
      console.error(e);
      // Fallback local update
      set({ gifts: [...state.gifts, img] });
    }
  },

  startGramMining: () => set((state) => {
    // 24 hours of mining
    const duration = 24 * 60 * 60 * 1000;
    return {
      gramMiningActiveUntil: Date.now() + duration,
      lastGramSync: Date.now()
    };
  }),

  upgradeGramMining: async (amount: number) => {
    const state = get();
    if (state.balance >= amount && amount >= 100000000) {
      if (!state.firebaseUid) return;
      const increase = (amount / 100000000) * 0.00005;
      
      try {
        await GameService.addBalance(state.firebaseUid, -amount, {
          gramMiningRate: state.gramMiningRate + increase
        });
        set(s => ({
          balance: Math.max(0, s.balance - amount),
          syncedBalance: Math.max(0, s.syncedBalance - amount),
          gramMiningRate: s.gramMiningRate + increase,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  },

  syncGramMining: () => set((state) => {
    const now = Date.now();
    // Only mine up to the end of the active mining session
    const effectiveNow = Math.min(now, state.gramMiningActiveUntil);
    const diffDays = (effectiveNow - Math.min(state.lastGramSync, state.gramMiningActiveUntil)) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 0) {
      return {
        gramBalance: state.gramBalance + (state.gramMiningRate * diffDays),
        lastGramSync: effectiveNow, // Keep track of the last time we granted coins
      };
    }
    return {};
  }),

  startTonMining: () => set((state) => {
    const duration = 24 * 60 * 60 * 1000;
    return {
      tonMiningActiveUntil: Date.now() + duration,
      lastTonSync: Date.now()
    };
  }),

  buyTonPackage: (amount: number, multiplier: number) => set((state) => {
    // Deduct abstract balance (representing stars/TON via api hypothetically if real, but frontend only required)
    // Actually, user wants paid packages in TON to increase mining speed. This is typically done via stars/TON in a real app, here we can simulate it or just let the button process it via TG stars api later.
    // For now we'll just apply the multiplier.
    return {
      tonMiningRate: state.tonMiningRate + multiplier,
    };
  }),

  upgradeTonMiningViaAds: () => set((state) => {
    const now = Date.now();
    const isNewDay = new Date(now).getUTCDate() !== new Date(state.lastTonAdReset).getUTCDate();
    
    let currentWatched = isNewDay ? 0 : state.tonAdsWatchedDaily;
    
    if (currentWatched < 10) {
      return {
        tonAdsWatchedDaily: currentWatched + 1,
        lastTonAdReset: now,
        tonMiningRate: state.tonMiningRate + 0.00005, // small increase
      };
    }
    return {};
  }),

  syncTonMining: () => set((state) => {
    const now = Date.now();
    const effectiveNow = Math.min(now, state.tonMiningActiveUntil);
    const diffDays = (effectiveNow - Math.min(state.lastTonSync, state.tonMiningActiveUntil)) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 0) {
      return {
        tonBalance: state.tonBalance + (state.tonMiningRate * diffDays),
        lastTonSync: effectiveNow,
      };
    }
    return {};
  }),

  requestWithdrawal: async (tokenAmount: number, coinCost: number, wallet: string) => {
    const state = get();
    if (!state.firebaseUid || state.balance < coinCost) return;
    
    try {
      const newWithdrawal = await GameService.requestWithdrawal(state.firebaseUid, tokenAmount, coinCost, wallet);
      set(s => ({
        balance: s.balance - coinCost,
        syncedBalance: s.syncedBalance - coinCost,
        withdrawals: [newWithdrawal, ...(s.withdrawals || [])]
      }));
    } catch(e) {
      console.error(e);
    }
  },

  claimPlushAirdrop: async () => {
    const state = get();
    if (!state.firebaseUid || state.hasClaimedPlushAirdrop) return;
    
    // Give 10 PLUSH worth of coins (100,000,000)
    const reward = 100000000;
    const newBalance = state.balance + reward;
    
    set({
      hasClaimedPlushAirdrop: true,
      balance: newBalance,
      syncedBalance: newBalance,
    });
    
    await GameService.syncState(state.firebaseUid, {
      balanceDelta: reward,
      hasClaimedPlushAirdrop: true,
    });
  },

  useSpin: () => set((state) => ({ 
    spinsLeft: Math.max(0, state.spinsLeft - 1),
    totalSpins: state.totalSpins + 1 
  })),
  checkSpinReset: () => set((state) => {
    const now = Date.now();
    const isNewDay = new Date(now).getUTCDate() !== new Date(state.lastSpinReset).getUTCDate();
    if (isNewDay) {
      return { spinsLeft: 3, lastSpinReset: now };
    }
    return {};
  }),

  clearJustReferred: () => set({ justReferred: false }),
  incrementAdsWatched: () => set((state) => ({ adsWatched: state.adsWatched + 1 })),
  incrementFriends: () => set((state) => ({ friendsCount: state.friendsCount + 1 })),
  setCooldown: (id, time) => set((state) => ({ cooldowns: { ...state.cooldowns, [id]: time } })),

  fetchUser: async (userId: string, username: string, firstName: string, startParam?: string, initData?: string) => {
    try {
      const fbUid = await AuthService.loginAnonymous(userId);
      set({ firebaseUid: fbUid, userId });

      let isVerifiedReferral = false;
      const API_URL = import.meta.env.VITE_API_URL || '';

      // Perform server-side validation check of Telegram Data before allowing referral
      if (startParam && startParam.startsWith('ref_')) {
          try {
             // Will hit Cloudflare Pages Function in Prod, or Express Server in Dev
             const response = await fetch(`${API_URL}/api/referral`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: initData || 'mock', startParam, telegramId: userId })
             });
             
             if (response.ok) {
                const result = await response.json();
                if (result.verified) {
                   isVerifiedReferral = true;
                }
             }
          } catch(e) {
             console.error("Referral verification failed", e);
          }
      }

      // Fetch user data from Firestore directly, securely parsing referral if verified
      const data: any = await GameService.fetchOrCreateUser(fbUid, userId.toString(), username, firstName, startParam, isVerifiedReferral);
      
      const currentState = get();
      if (data.balance === 0 && currentState.balance > 0) {
        // Server likely restarted, sync our local data up
        currentState.sync();
        currentState.updateFromOffline();
      } else {
        set({
          balance: data.balance || 0,
          syncedBalance: data.balance || 0,
          energy: Math.min(data.energy || 1500, Math.max(currentState.maxEnergy || 1500, currentState.energy)),
          profitPerHour: data.profitPerHour || 0,
          lastLogin: data.lastLogin || Date.now(),
          role: data.role || 'user',
          upgrades: data.upgrades || {},
          missions: data.missions || [],
          gifts: data.gifts || [],
          friendsCount: data.friendsCount || 0,
          adsWatched: data.adsWatched || 0,
          tonBalance: data.tonBalance || get().tonBalance || 0,
          tonMiningRate: data.tonMiningRate || get().tonMiningRate || 0.001,
          lastTonSync: data.lastTonSync || get().lastTonSync || Date.now(),
          tonMiningActiveUntil: data.tonMiningActiveUntil || get().tonMiningActiveUntil || 0,
          gramBalance: data.gramBalance || get().gramBalance || 0,
          gramMiningRate: data.gramMiningRate || get().gramMiningRate || 0.0001,
          lastGramSync: data.lastGramSync || get().lastGramSync || Date.now(),
          gramMiningActiveUntil: data.gramMiningActiveUntil || get().gramMiningActiveUntil || 0,
          withdrawals: data.withdrawals || [],
          hasClaimedPlushAirdrop: data.hasClaimedPlushAirdrop || false,
          userId,
          username,
          justReferred: !!data._justReferred
        });
        get().updateFromOffline();
      }
    } catch(e) {
      console.error(e);
    }
  },

  buyUpgradeApi: async (upgradeId: string, cost: number, profitInc: number) => {
    const state = get();
    if (!state.firebaseUid) return;
    try {
       await GameService.buyUpgrade(state.firebaseUid, upgradeId, cost, profitInc);
       set(state => ({
         balance: Math.max(0, state.balance - cost),
         syncedBalance: Math.max(0, state.syncedBalance - cost),
         profitPerHour: state.profitPerHour + profitInc,
         upgrades: { ...state.upgrades, [upgradeId]: (state.upgrades[upgradeId] || 0) + 1 }
       }));
    } catch(e) {
      console.error(e);
    }
  },

  completeMissionApi: async (missionId: string, reward: number) => {
    const state = get();
    if (!state.firebaseUid) return;
    try {
      await GameService.addBalance(state.firebaseUid, reward, {
         missions: [...state.missions, missionId]
      });
      set(state => ({
         balance: state.balance + reward,
         missions: [...state.missions, missionId]
      }));
    } catch(e) {
      console.error(e);
    }
  },

  sync: async () => {
    const state = get();
    if (!state.firebaseUid) return;
    try {
      const balanceDelta = Math.max(0, state.balance - state.syncedBalance);
      
      const result = await GameService.syncState(state.firebaseUid, {
          balanceDelta,
          energy: state.energy,
          lastLogin: Date.now(),
          adsWatched: state.adsWatched,
          tonBalance: state.tonBalance,
          tonMiningRate: state.tonMiningRate,
          lastTonSync: state.lastTonSync,
          tonMiningActiveUntil: state.tonMiningActiveUntil,
          gramBalance: state.gramBalance,
          gramMiningRate: state.gramMiningRate,
          lastGramSync: state.lastGramSync,
          gramMiningActiveUntil: state.gramMiningActiveUntil,
          hasClaimedPlushAirdrop: state.hasClaimedPlushAirdrop,
      });
      
      if (result) {
         // Update our local state with the server's truth
         set({
            balance: result.balance,
            syncedBalance: result.balance,
            friendsCount: result.friendsCount || state.friendsCount
         });
      }
    } catch(e) {
      console.error(e);
    }
  },

  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),

  reduceEnergy: (amount) => {
    const state = get();
    if (state.energy >= amount) {
      set({ energy: state.energy - amount });
      return true;
    }
    return false;
  },

  increaseEnergy: (amount) => set((state) => ({
    energy: Math.min(state.maxEnergy, state.energy + amount)
  })),

  buyUpgrade: (cost, profitIncrease) => {
    const state = get();
    if (state.balance >= cost) {
      set({
        balance: state.balance - cost,
        profitPerHour: state.profitPerHour + profitIncrease
      });
      return true;
    }
    return false;
  },

  updateFromOffline: () => {
    const state = get();
    const now = Date.now();
    const secondsPassed = Math.floor((now - state.lastLogin) / 1000);
    
    // Only calculate offline earnings if they've been away for at least 1 minute
    if (secondsPassed >= 60) {
      // Typically tap games cap offline limit to 3 hours (10800 secs)
      const maxOfflineSeconds = 3 * 3600;
      const actualSeconds = Math.min(secondsPassed, maxOfflineSeconds);
      
      const offlineCoins = Math.floor((state.profitPerHour / 3600) * actualSeconds);
      // Energy regen is 3 per second, no time cap but maxed at maxEnergy
      const energyRegen = secondsPassed * 3;

      set((state) => ({
        offlineEarnings: (state.offlineEarnings || 0) + (offlineCoins > 0 ? offlineCoins : 0),
        energy: Math.min(state.maxEnergy, state.energy + energyRegen),
        lastLogin: now
      }));
      // Fire sync immediately to save to backend
      get().sync();
    } else if (secondsPassed > 0) {
      // Just regenerate energy if they were away for less than a minute
      const energyRegen = secondsPassed * 3;
      set({
        energy: Math.min(state.maxEnergy, state.energy + energyRegen),
        lastLogin: now
      });
      get().sync();
    }
  },

  claimOfflineEarnings: () => {
    const state = get();
    if (state.offlineEarnings > 0) {
      set({
        balance: state.balance + state.offlineEarnings,
        offlineEarnings: 0
      });
      get().sync();
    }
  }
}), {
  name: 'game-storage',
}));
