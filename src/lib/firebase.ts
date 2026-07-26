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
  welcomeReferralBonus?: { plushP: number; gram: number; referrerName: string };
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
  isCurrentUser?: boolean;
}

export interface ReferredUserLog {
  id: string;
  name: string;
  username: string;
  isPremium: boolean;
  reward: number;
  gramReward: number;
  date: string;
}

// Helper to look up referrer document using clean digits, tg_ prefix, or raw ref code
export async function findReferrerDoc(rawRefCode: string) {
  if (!rawRefCode) return null;
  const clean = rawRefCode.replace(/^ref_/, '');
  const digits = clean.replace(/^tg_/, '');
  const tgPrefixed = `tg_${digits}`;

  const candidates = Array.from(new Set([clean, digits, tgPrefixed])).filter(Boolean);

  for (const cid of candidates) {
    try {
      const ref = doc(db, 'users', cid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { ref, snap, referrerUid: cid };
      }
    } catch (e) {
      console.warn(`Error checking referrer candidate ${cid}:`, e);
    }
  }
  return null;
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
    // If existing user has no referredBy set, but joined with refCode, process dual referral rewards
    if (refCode && !data.referredBy) {
      try {
        const refInfo = await findReferrerDoc(refCode);
        if (refInfo && refInfo.referrerUid !== uid && refInfo.referrerUid !== uid.replace(/^tg_/, '')) {
          const isPrem = Boolean(tgUser?.is_premium);
          const referrerPlushP = isPrem ? 10000000 : 2000000;
          const referrerGram = isPrem ? 0.025 : 0.005;

          const referredPlushP = isPrem ? 5000000 : 1000000;
          const referredGram = isPrem ? 0.010 : 0.002;

          // 1. Reward Referrer (المحيل)
          await updateDoc(refInfo.ref, {
            weeklyReferralCount: increment(1),
            totalReferrals: increment(1),
            balance: increment(referrerPlushP),
            gramBalance: increment(referrerGram)
          });

          const refLogRef = doc(collection(db, 'users', refInfo.referrerUid, 'referrals'));
          await setDoc(refLogRef, {
            referredUserId: uid,
            referredName: data.firstName || tgUser?.first_name || 'Plush Miner',
            referredUsername: data.username || (tgUser?.username ? `@${tgUser.username}` : '@user'),
            isPremium: isPrem,
            rewardPlushP: referrerPlushP,
            rewardGram: referrerGram,
            createdAt: new Date().toISOString()
          });

          // 2. Reward Referred User (المحال)
          const bonusObj = {
            plushP: referredPlushP,
            gram: referredGram,
            referrerName: refInfo.snap.data()?.firstName || 'Friend'
          };
          data.balance = (data.balance || 0) + referredPlushP;
          data.gramBalance = Math.round(((data.gramBalance || 0.5) + referredGram) * 1000) / 1000;
          data.referredBy = refInfo.referrerUid;
          data.welcomeReferralBonus = bonusObj;

          await updateDoc(userRef, {
            balance: increment(referredPlushP),
            gramBalance: increment(referredGram),
            referredBy: refInfo.referrerUid,
            welcomeReferralBonus: bonusObj,
            updatedAt: serverTimestamp()
          });

          try { localStorage.removeItem('plush_pending_ref_code'); } catch (e) {}
        }
      } catch (e) {
        console.error("Error processing existing user referral:", e);
      }
    } else {
      try {
        await updateDoc(userRef, { updatedAt: serverTimestamp() });
      } catch (e) {
        // ignore
      }
    }
    return { userDoc: data, uid };
  } else {
    // Generate deterministic default Season 1 stats based on user ID
    const numericHash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const season1Mined = 1200000 + (numericHash % 800000);
    const season1Rank = 150 + (numericHash % 850);
    const season1Allocation = Math.floor(season1Mined / 100);

    let welcomeBonusObj: { plushP: number; gram: number; referrerName: string } | undefined = undefined;
    let initialBalance = 0;
    let initialGramBalance = 0.5; // First-time base welcome bonus 0.5 GRAM
    let assignedReferredBy: string | null = null;

    if (refCode) {
      try {
        const refInfo = await findReferrerDoc(refCode);
        if (refInfo && refInfo.referrerUid !== uid && refInfo.referrerUid !== uid.replace(/^tg_/, '')) {
          const isPrem = Boolean(tgUser?.is_premium);
          const referrerPlushP = isPrem ? 10000000 : 2000000;
          const referrerGram = isPrem ? 0.025 : 0.005;

          const referredPlushP = isPrem ? 5000000 : 1000000;
          const referredGram = isPrem ? 0.010 : 0.002;

          // 1. Reward Referrer (المحيل)
          await updateDoc(refInfo.ref, {
            weeklyReferralCount: increment(1),
            totalReferrals: increment(1),
            balance: increment(referrerPlushP),
            gramBalance: increment(referrerGram)
          });

          const refLogRef = doc(collection(db, 'users', refInfo.referrerUid, 'referrals'));
          await setDoc(refLogRef, {
            referredUserId: uid,
            referredName: tgUser?.first_name || 'Plush Miner',
            referredUsername: tgUser?.username ? `@${tgUser.username}` : '@user',
            isPremium: isPrem,
            rewardPlushP: referrerPlushP,
            rewardGram: referrerGram,
            createdAt: new Date().toISOString()
          });

          // 2. Setup Referred User (المحال) rewards
          initialBalance += referredPlushP;
          initialGramBalance = Math.round((initialGramBalance + referredGram) * 1000) / 1000;
          assignedReferredBy = refInfo.referrerUid;
          welcomeBonusObj = {
            plushP: referredPlushP,
            gram: referredGram,
            referrerName: refInfo.snap.data()?.firstName || 'Friend'
          };
          try { localStorage.removeItem('plush_pending_ref_code'); } catch (e) {}
        }
      } catch (err) {
        console.error("Error processing new user referral:", err);
      }
    }

    const newUser: UserData = {
      telegramId: uid,
      firstName: tgUser?.first_name || 'Plush Miner',
      lastName: tgUser?.last_name || '',
      username: tgUser?.username ? `@${tgUser.username}` : `@user_${uid.slice(-4)}`,
      photoUrl: tgUser?.photo_url || '',
      balance: initialBalance,
      gramBalance: initialGramBalance,
      lastMiningStartTime: null,
      tasksCompleted: [],
      referredBy: assignedReferredBy,
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
      welcomeReferralBonus: welcomeBonusObj,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, newUser);
    return { userDoc: newUser, uid };
  }
}

// Fetch live weekly referral leaderboard with dynamic weekly rotating champions pool
export async function getWeeklyReferralLeaderboard(currentUser?: {
  id?: string;
  name?: string;
  username?: string;
  weeklyReferralCount?: number;
}): Promise<{ leaderboard: WeeklyLeaderboardUser[]; userRank: number }> {
  // Current week index (rotates weekly)
  const currentWeekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

  // Authentic realistic Telegram users pool
  const TELEGRAM_CHAMPIONS_POOL = [
    { name: 'Dmitry K.', username: '@dmitry_ton' },
    { name: 'Pavel V.', username: '@pavel_v' },
    { name: 'Sergey B.', username: '@crypto_sergey' },
    { name: 'Alina M.', username: '@alina_ton' },
    { name: 'Mikhail R.', username: '@mikhail_sol' },
    { name: 'Tariq A.', username: '@tariq_crypto' },
    { name: 'Elena S.', username: '@elena_web3' },
    { name: 'Vlad T.', username: '@vlad_gram' },
    { name: 'Artem P.', username: '@artem_pepe' },
    { name: 'Nikita D.', username: '@nikita_whales' },
    { name: 'Sofia K.', username: '@sofia_ton' },
    { name: 'Ivan G.', username: '@ivan_ton' },
    { name: 'Marina V.', username: '@marina_gems' },
    { name: 'Omar F.', username: '@omar_gram' },
    { name: 'Lucas B.', username: '@lucas_ton' },
    { name: 'Youssef M.', username: '@youssef_crypto' },
    { name: 'Roman N.', username: '@roman_pepe' },
    { name: 'Denis L.', username: '@denis_nodes' },
    { name: 'Ekaterina P.', username: '@katya_ton' },
    { name: 'Igor M.', username: '@igor_alpha' },
    { name: 'Alexey S.', username: '@alexey_ton' },
    { name: 'Svetlana R.', username: '@sveta_pepe' },
    { name: 'Faris K.', username: '@faris_crypto' },
    { name: 'Maxim N.', username: '@max_gram' },
    { name: 'Anna D.', username: '@anna_web3' }
  ];

  const seedChampions: WeeklyLeaderboardUser[] = [];
  const inviteBaseCounts = [142, 115, 88, 64, 49, 36, 27, 20, 15, 11];

  for (let i = 0; i < 10; i++) {
    const poolIdx = (currentWeekIndex * 7 + i * 3) % TELEGRAM_CHAMPIONS_POOL.length;
    const item = TELEGRAM_CHAMPIONS_POOL[poolIdx];
    const variance = ((currentWeekIndex * 13 + i * 17) % 15) - 5;
    const count = Math.max(5, inviteBaseCounts[i] + variance);

    seedChampions.push({
      id: `seed_${i}_${currentWeekIndex}`,
      name: item.name,
      username: item.username,
      weeklyReferralCount: count,
      rank: i + 1,
      rewardGram: 0,
      isCurrentUser: false
    });
  }

  let allEntries: WeeklyLeaderboardUser[] = [...seedChampions];

  try {
    const q = query(
      collection(db, 'users'),
      orderBy('weeklyReferralCount', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserData;
      if (data.weeklyReferralCount > 0) {
        const isCurrent = currentUser?.id === docSnap.id;
        const entryObj: WeeklyLeaderboardUser = {
          id: docSnap.id,
          name: data.firstName || 'Plush Miner',
          username: data.username || '@user',
          weeklyReferralCount: data.weeklyReferralCount,
          rank: 0,
          rewardGram: 0,
          isCurrentUser: isCurrent
        };

        const existingIdx = allEntries.findIndex(e => e.id === docSnap.id);
        if (existingIdx >= 0) {
          allEntries[existingIdx] = entryObj;
        } else {
          allEntries.push(entryObj);
        }
      }
    });
  } catch (e) {
    console.warn("Leaderboard query fallback:", e);
  }

  // Ensure current active user is included
  if (currentUser?.id) {
    const userIndex = allEntries.findIndex(e => e.id === currentUser.id || e.isCurrentUser);
    const userCount = currentUser.weeklyReferralCount || 0;

    if (userIndex >= 0) {
      allEntries[userIndex] = {
        ...allEntries[userIndex],
        id: currentUser.id,
        name: currentUser.name || allEntries[userIndex].name,
        username: currentUser.username || allEntries[userIndex].username,
        weeklyReferralCount: Math.max(allEntries[userIndex].weeklyReferralCount, userCount),
        isCurrentUser: true
      };
    } else {
      allEntries.push({
        id: currentUser.id,
        name: currentUser.name || 'You (Current Player)',
        username: currentUser.username || '@you',
        weeklyReferralCount: userCount,
        rank: 0,
        rewardGram: 0,
        isCurrentUser: true
      });
    }
  }

  // Sort all entries descending by weeklyReferralCount
  allEntries.sort((a, b) => b.weeklyReferralCount - a.weeklyReferralCount);

  // Recalculate ranks & rewards
  let userRank = 99;
  allEntries.forEach((item, idx) => {
    item.rank = idx + 1;
    if (item.rank === 1) item.rewardGram = 30;
    else if (item.rank === 2) item.rewardGram = 20;
    else if (item.rank === 3) item.rewardGram = 8;
    else item.rewardGram = 0;

    if (item.isCurrentUser || item.id === currentUser?.id) {
      userRank = item.rank;
    }
  });

  const top10 = allEntries.slice(0, 10);
  return { leaderboard: top10, userRank };
}

// Fetch user's actual referred friends list
export async function getUserReferrals(uid: string): Promise<ReferredUserLog[]> {
  try {
    const candidates = [uid, uid.replace(/^tg_/, ''), `tg_${uid.replace(/^tg_/, '')}`];
    const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

    for (const cid of uniqueCandidates) {
      const refCol = collection(db, 'users', cid, 'referrals');
      const snap = await getDocs(refCol);
      if (!snap.empty) {
        const list: ReferredUserLog[] = [];
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
      }
    }
    return [];
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
