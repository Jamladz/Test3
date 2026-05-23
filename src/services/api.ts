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
  async fetchOrCreateUser(uid: string, telegramId: string, username: string, firstName: string, startParam?: string) {
    const userRef = doc(db, 'users', uid);
    
    try {
      const resultData = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        let userData = snap.exists() ? snap.data() : null;

        let validReferrer = false;
        let referrerUid = null;

        // Handle Referral logic
        if (startParam && startParam.startsWith('ref')) {
           referrerUid = startParam.replace('ref', '');
           
           // Ensure not self-referral, and user isn't already referred
           const alreadyReferred = userData?.referredBy != null;
           
           if (referrerUid && referrerUid !== uid && !alreadyReferred) {
              const referrerRef = doc(db, 'users', referrerUid);
              const referrerSnap = await transaction.get(referrerRef);
              
              if (referrerSnap.exists()) {
                 validReferrer = true;
                 
                 // Increase referrer's balance and friend count
                 transaction.update(referrerRef, {
                    balance: increment(100000),
                    friendsCount: increment(1)
                 });

                 // Save referral details for the referrer to see
                 const refDoc = doc(db, 'referrals', uid);
                 transaction.set(refDoc, {
                    userId: uid,
                    referrerId: referrerUid,
                    telegramId: telegramId,
                    firstName: firstName,
                    username: username,
                    createdAt: serverTimestamp()
                 });
              }
           }
        }

        if (!snap.exists()) {
          const initialData = {
            id: telegramId,
            username,
            firstName,
            balance: validReferrer ? 60000 : 10000,
            energy: 1500,
            maxEnergy: 1500,
            profitPerHour: 0,
            lastLogin: Date.now(),
            role: username === 'sekanedr_is' ? 'admin' : 'user',
            upgrades: {},
            missions: [],
            friendsCount: 0,
            adsWatched: 0,
            referredBy: validReferrer ? referrerUid : null
          };

          transaction.set(userRef, initialData);
          return initialData;
        } else {
          // If the user already existed but we just processed a new valid referral for them
          if (validReferrer) {
             const updatedBalance = (userData.balance || 0) + 50000; // 60k instead of 10k -> difference is 50k
             transaction.update(userRef, {
                referredBy: referrerUid,
                balance: updatedBalance
             });
             userData.referredBy = referrerUid;
             userData.balance = updatedBalance;
          }
          return userData;
        }
      });

      return resultData;

    } catch (e) {
      console.error("Transaction failed: ", e);
      // Fallback read if tx fails
      const snap = await getDoc(userRef);
      return snap.data();
    }
  },

  async syncState(uid: string, obj: any) {
    const userRef = doc(db, 'users', uid);
    // Remove transient field offlineEarnings
    const { offlineEarnings, ...rest } = obj; 
    await updateDoc(userRef, rest);
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
    usersSnap.forEach(doc => {
       const u = doc.data();
       totalEconomy += (u.balance || 0);
       if (u.role === 'banned') bannedBots++;
    });
    return { totalUsers: usersSnap.size, totalEconomy, bannedBots };
  },

  async updateWallet(uid: string, address: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { walletAddress: address });
  }
};
