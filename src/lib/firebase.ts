import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

export interface UserData {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  balance: number; // $PLUSH balance
  gramBalance: number; // GRAM balance
  lastMiningStartTime: number | null; // ms timestamp
  tasksCompleted: string[];
  referredBy: string | null;
  weeklyReferralCount: number;
  totalReferrals: number;
  walletAddress: string;
  season1MinedTokens: number;
  season1Rank: number;
  season1Tier: string;
  season1Allocation: number;
  season1Claimed: boolean;
  dailyStreak: number;
  lastCheckInDate: string | null;
  userMiningCards?: Record<string, { lastClaimTime: number; purchased?: boolean }>;
  depositedGramBalance?: number;
  activeStakes?: any[];
  createdAt?: any;
  updatedAt?: any;
}

export interface WeeklyLeaderboardUser {
  id: string;
  name: string;
  username: string;
  photoUrl?: string;
  weeklyReferralCount: number;
  rank: number;
  rewardGram: number;
}

// Get or create Telegram user profile in Firestore
export async function syncUserProfile(tgUser?: any, refCode?: string | null): Promise<{ userDoc: UserData; uid: string }> {
  let uid = tgUser?.id ? String(tgUser.id) : null;

  if (!auth.currentUser) {
    try {
      const userCred = await signInAnonymously(auth);
      if (!uid) uid = userCred.user.uid;
    } catch (e) {
      console.warn("Anonymous auth fallback:", e);
      if (!uid) uid = "anon_" + Math.floor(Math.random() * 1000000);
    }
  } else if (!uid) {
    uid = auth.currentUser.uid;
  }

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserData;
    // Update active timestamp
    try {
      await updateDoc(userRef, { updatedAt: serverTimestamp() });
    } catch (e) {
      // ignore
    }
    return { userDoc: data, uid };
  } else {
    // Generate deterministic default Season 1 stats based on user ID
    const numericHash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const season1Mined = 1200000 + (numericHash % 800000);
    const season1Rank = 150 + (numericHash % 850);
    const season1Allocation = Math.floor(season1Mined / 100);

    const newUser: UserData = {
      telegramId: uid,
      firstName: tgUser?.first_name || 'Plush Miner',
      lastName: tgUser?.last_name || '',
      username: tgUser?.username ? `@${tgUser.username}` : `@user_${uid.slice(-4)}`,
      photoUrl: tgUser?.photo_url || '',
      balance: 0, // Season 2 balance starts strictly from 0
      gramBalance: 0.5, // First-time welcome bonus 0.5 GRAM
      lastMiningStartTime: null,
      tasksCompleted: [],
      referredBy: refCode || null,
      weeklyReferralCount: 0,
      totalReferrals: 0,
      walletAddress: '',
      season1MinedTokens: season1Mined,
      season1Rank: season1Rank,
      season1Tier: season1Rank <= 300 ? '🏆 Diamond Plush Tier' : '🥇 Gold Plush Tier',
      season1Allocation: season1Allocation,
      season1Claimed: false,
      dailyStreak: 1,
      lastCheckInDate: null,
      userMiningCards: {},
      depositedGramBalance: 0,
      activeStakes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, newUser);

    // Record referral if user joined via a referral link
    if (refCode && refCode !== uid) {
      try {
        const referrerRef = doc(db, 'users', refCode);
        const refSnap = await getDoc(referrerRef);
        if (refSnap.exists()) {
          const isPrem = Boolean(tgUser?.is_premium);
          const rewardPlushP = isPrem ? 10000000 : 2000000;
          const rewardGram = isPrem ? 0.025 : 0.005;
          await updateDoc(referrerRef, {
            weeklyReferralCount: increment(1),
            totalReferrals: increment(1),
            balance: increment(rewardPlushP),
            gramBalance: increment(rewardGram)
          });
          
          const refLogRef = doc(collection(db, 'users', refCode, 'referrals'));
          await setDoc(refLogRef, {
            referredUserId: uid,
            referredName: newUser.firstName,
            referredUsername: newUser.username,
            isPremium: isPrem,
            rewardPlushP: rewardPlushP,
            rewardGram: rewardGram,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error processing referral:", err);
      }
    }

    return { userDoc: newUser, uid };
  }
}

// Fetch live weekly referral leaderboard from Firestore
export async function getWeeklyReferralLeaderboard(): Promise<WeeklyLeaderboardUser[]> {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('weeklyReferralCount', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const list: WeeklyLeaderboardUser[] = [];
    let rank = 1;

    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserData;
      let rewardGram = 0;
      if (rank === 1) rewardGram = 30;
      else if (rank === 2) rewardGram = 20;
      else if (rank === 3) rewardGram = 8;

      list.push({
        id: docSnap.id,
        name: data.firstName || 'User',
        username: data.username || '@user',
        photoUrl: data.photoUrl,
        weeklyReferralCount: data.weeklyReferralCount || 0,
        rank,
        rewardGram
      });
      rank++;
    });

    if (list.length < 3) {
      const seedChampions: WeeklyLeaderboardUser[] = [
        { id: 'seed_1', name: 'Hamza TON', username: '@hamza_ton', weeklyReferralCount: 142, rank: 1, rewardGram: 30 },
        { id: 'seed_2', name: 'Alex Crypto', username: '@alex_crypto', weeklyReferralCount: 98, rank: 2, rewardGram: 20 },
        { id: 'seed_3', name: 'Sarah TG', username: '@sara_tg', weeklyReferralCount: 65, rank: 3, rewardGram: 8 }
      ];
      return seedChampions;
    }

    return list;
  } catch (e) {
    console.error("Leaderboard query error:", e);
    return [
      { id: 'seed_1', name: 'Hamza TON', username: '@hamza_ton', weeklyReferralCount: 142, rank: 1, rewardGram: 30 },
      { id: 'seed_2', name: 'Alex Crypto', username: '@alex_crypto', weeklyReferralCount: 98, rank: 2, rewardGram: 20 },
      { id: 'seed_3', name: 'Sarah TG', username: '@sara_tg', weeklyReferralCount: 65, rank: 3, rewardGram: 8 }
    ];
  }
}

// Fetch user's actual referred friends list
export async function getUserReferrals(uid: string) {
  try {
    const refCol = collection(db, 'users', uid, 'referrals');
    const snap = await getDocs(refCol);
    const list: any[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        name: data.referredName || 'Referred Friend',
        username: data.referredUsername || '@user',
        isPremium: Boolean(data.isPremium),
        reward: data.rewardPlushP || 2000000,
        gramReward: data.rewardGram || 0.005,
        date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recently'
      });
    });
    return list;
  } catch (err) {
    console.error("Error fetching user referrals:", err);
    return [];
  }
}

export interface AdminUserRecord {
  id: string;
  username: string;
  firstName: string;
  balance: number;
  gramBalance: number;
  totalReferrals: number;
  isActive24h: boolean;
}

export async function getAdminDashboardData() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    let totalUsers = 0;
    let active24h = 0;
    let totalPlushCoins = 0;
    let totalGramCoins = 0;

    const usersList: AdminUserRecord[] = [];

    snap.forEach((docSnap) => {
      totalUsers++;
      const data = docSnap.data();
      const plush = data.balance || 0;
      const gram = data.gramBalance || 0;
      const refs = data.totalReferrals || data.weeklyReferralCount || 0;

      let lastActiveMs = 0;
      if (data.updatedAt) {
        if (typeof data.updatedAt.toMillis === 'function') {
          lastActiveMs = data.updatedAt.toMillis();
        } else if (typeof data.updatedAt === 'number') {
          lastActiveMs = data.updatedAt;
        }
      } else if (data.lastMiningStartTime) {
        lastActiveMs = data.lastMiningStartTime;
      }

      const isActive24h = lastActiveMs === 0 || (now - lastActiveMs) <= twentyFourHoursMs;
      if (isActive24h) active24h++;

      totalPlushCoins += plush;
      totalGramCoins += gram;

      usersList.push({
        id: docSnap.id,
        username: data.username || `@user_${docSnap.id.slice(-4)}`,
        firstName: data.firstName || 'Player',
        balance: plush,
        gramBalance: gram,
        totalReferrals: refs,
        isActive24h
      });
    });

    return {
      totalUsers,
      active24h,
      totalPlushCoins,
      totalGramCoins,
      usersList
    };
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    return {
      totalUsers: 0,
      active24h: 0,
      totalPlushCoins: 0,
      totalGramCoins: 0,
      usersList: []
    };
  }
}

export interface WithdrawalRequestItem {
  id: string;
  userId: string;
  username: string;
  currency: 'GRAM' | 'PLUSH';
  amount: number;
  recipientAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export async function getWithdrawalRequests(): Promise<WithdrawalRequestItem[]> {
  try {
    const snap = await getDocs(collection(db, 'withdrawal_requests'));
    const list: WithdrawalRequestItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        userId: data.userId || 'unknown',
        username: data.username || 'User',
        currency: data.currency || 'GRAM',
        amount: data.amount || 0,
        recipientAddress: data.recipientAddress || 'N/A',
        status: data.status || 'pending',
        createdAt: data.createdAt ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()).toLocaleDateString() : 'Recent'
      });
    });
    return list;
  } catch (err) {
    console.error("Error fetching withdrawal requests:", err);
    return [];
  }
}

export async function updateWithdrawalStatus(requestId: string, status: 'approved' | 'rejected') {
  try {
    const ref = doc(db, 'withdrawal_requests', requestId);
    await updateDoc(ref, { status });
    return true;
  } catch (err) {
    console.error("Error updating withdrawal status:", err);
    return false;
  }
}
