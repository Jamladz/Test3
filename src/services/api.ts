import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, collection, setDoc as setRef, query, where, getDocs, getCountFromServer } from 'firebase/firestore';

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
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      // Handle Referral sign up
      if (startParam && startParam.startsWith('ref')) {
        const referrerId = startParam.replace('ref', '');
        if (referrerId && referrerId !== telegramId.toString()) {
          try {
            const refDoc = doc(db, 'referrals', uid);
            await setDoc(refDoc, { userId: uid, referrerId });
            
            // Note: In a real Cloudflare Worker / Cloud Function, the bonus logic would be atomic.
            // For pure client-side with our rules, we give standard new user bounds or rely on claiming later.
            // To keep it simple and within our rules: we will let them start with 50000 
          } catch(e) {
            console.error("Referral failed", e);
          }
        }
      }

      const initialData = {
        id: telegramId,
        username,
        firstName,
        balance: startParam?.startsWith('ref') ? 50000 : 0,
        energy: 1500,
        maxEnergy: 1500,
        profitPerHour: 0,
        lastLogin: Date.now(),
        role: 'user',
        upgrades: {},
        missions: [],
        friendsCount: 0,
        adsWatched: 0,
      };
        if (username === 'sekanedr_is') {
           initialData.role = 'admin';
           try {
              const adminRef = doc(db, 'admins', uid);
              await setRef(adminRef, { access: true });
           } catch(e) {}
        }

      await setDoc(userRef, initialData);
      return initialData;
    }
    
    // Check friend count manually since we don't have triggers
    const refQuery = query(collection(db, 'referrals'), where('referrerId', '==', telegramId));
    const refSnap = await getCountFromServer(refQuery);
    const count = refSnap.data().count;
    const data = snap.data();
    
    if (count > (data.friendsCount || 0)) {
       const diff = count - (data.friendsCount || 0);
       const bonus = diff * 100000;
       
       await updateDoc(userRef, { 
           friendsCount: count,
           balance: increment(bonus)
       });
       
       if (data.balance !== undefined) {
           data.balance += bonus;
       }
       data.friendsCount = count;
    }

    return data;
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
