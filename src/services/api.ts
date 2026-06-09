import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, collection, setDoc as setRef, query, where, getDocs, getCountFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';

export const AuthService = {
  // Returns a firebase user UID
  async loginAnonymous(telegramId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          resolve(user.uid);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            resolve(credential.user.uid);
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }
};

export const GameService = {
  async fetchOrCreateUser(uid: string, telegramId: string, username: string, firstName: string, startParam?: string, isVerifiedReferral: boolean = false) {
    const userRef = doc(db, 'users', uid);
    
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
          // If we had a valid startParam and are verified, process the friend reward!
          let referredBy = null;
          let initialBalance = 10000;
          let referralRewardClaimed = false;

          if (isVerifiedReferral && startParam && startParam.startsWith('ref')) {
             const referrerId = startParam.replace('ref', '');
             // Find the referring user by telegram ID
             const q = query(collection(db, 'users'), where('id', '==', referrerId));
             const referrerSnap = await getDocs(q);
             
             if (!referrerSnap.empty) {
                const referrerDoc = referrerSnap.docs[0];
                referredBy = referrerId;
                referralRewardClaimed = true;
                // Grant reward to friend (e.g., 50000 coins + 1 friend count)
                await updateDoc(referrerDoc.ref, {
                   balance: increment(50000),
                   friendsCount: increment(1)
                });
                // Grant bonus to new user
                initialBalance += 50000;
             }
          }

          const initialData: any = {
             id: telegramId.toString(),
             username: username || '',
             firstName: firstName || 'Anonymous',
             balance: initialBalance,
             energy: 1500,
             maxEnergy: 1500,
             profitPerHour: 0,
             lastLogin: Date.now(),
             role: username === 'sekanedr_is' ? 'admin' : 'user',
             upgrades: {},
             missions: [],
             friendsCount: 0,
             adsWatched: 0,
             referredBy,
             referralRewardClaimed
          };
          await setRef(userRef, initialData);
          return { ...initialData, _justReferred: referralRewardClaimed };
      }
      return snap.data();
    } catch (e) {
      console.error("fetchOrCreateUser User fetch failed: ", e);
      return null;
    }
  },

  async syncState(uid: string, deltas: any) {
    const userRef = doc(db, 'users', uid);
    
    try {
      const resultData = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(userRef);
          if (!snap.exists()) return null;
          
          const data = snap.data();
          
          // Calculate new balance securely using the delta
          const balanceDelta = deltas.balanceDelta || 0;
          const newBalance = Math.max(0, (data.balance || 0) + balanceDelta);
          
          // Allow friendsCount to only go up or stay same
          const currentAds = data.adsWatched || 0;
          const newAds = Math.max(currentAds, deltas.adsWatched || 0);

          const updates: any = {
              balance: newBalance,
              energy: deltas.energy ?? data.energy,
              lastLogin: deltas.lastLogin || Date.now(),
              adsWatched: newAds
          };

          transaction.update(userRef, updates);
          
          return { ...data, ...updates };
      });
      return resultData;
    } catch (e) {
      console.error("Sync Transaction failed: ", e);
      return null;
    }
  },

  async addBalance(uid: string, amount: number, fieldsToUpdate: any = {}) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
       balance: increment(amount),
       ...fieldsToUpdate
    });
  },

  async buyUpgrade(uid: string, upgradeId: string, cost: number, profitInc: number) {
     const userRef = doc(db, 'users', uid);
     // Firebase allows nested map updates using dot notation
     await updateDoc(userRef, {
        balance: increment(-cost),
        profitPerHour: increment(profitInc),
        [`upgrades.${upgradeId}`]: increment(1)
     });
  },

  async getAdminStats() {
    const usersSnap = await getDocs(collection(db, 'users'));
    let totalEconomy = 0;
    let bannedBots = 0;
    const usersList: any[] = [];
    usersSnap.forEach(doc => {
       const u = doc.data();
       totalEconomy += (u.balance || 0);
       if (u.role === 'banned') bannedBots++;
       usersList.push(u);
    });
    // Sort users by balance descended
    usersList.sort((a,b) => (b.balance || 0) - (a.balance || 0));
    return { totalUsers: usersSnap.size, totalEconomy, bannedBots, users: usersList };
  },

  async updateWallet(uid: string, address: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { walletAddress: address });
  }
};
