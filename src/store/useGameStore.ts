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
  fetchUser: (userId: string, username: string, firstName: string, startParam?: string) => Promise<void>;
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
  useSpin: () => void;
  checkSpinReset: () => void;
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

  fetchUser: async (userId: string, username: string, firstName: string, startParam?: string) => {
    try {
      const fbUid = await AuthService.loginAnonymous(userId);
      set({ firebaseUid: fbUid, userId });

      const data: any = await GameService.fetchOrCreateUser(fbUid, userId.toString(), username, firstName, startParam);
      
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
          friendsCount: data.friendsCount || 0,
          adsWatched: data.adsWatched || 0,
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
         balance: state.balance - cost,
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
          adsWatched: state.adsWatched
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
