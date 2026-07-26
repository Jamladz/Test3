import fs from 'fs';
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const replacement = `
  async fetchOrCreateUser(uid: string, telegramId: string, username: string, firstName: string, startParam?: string, isVerifiedReferral: boolean = false) {
    const userRef = doc(db, getCollectionName('users'), uid);
    
    try {
      const snap = await getDoc(userRef);
      
      let season1Stats = null;
      if (CURRENT_SEASON > 1) {
         // Attempt to read from Season 1 to bring legacy stats over
         const s1Ref = doc(db, 'users', uid);
         const s1Snap = await getDoc(s1Ref);
         if (s1Snap.exists()) {
             const s1Data = s1Snap.data();
             season1Stats = {
                balance: s1Data.balance || 0,
                profitPerHour: s1Data.profitPerHour || 0,
                friendsCount: s1Data.friendsCount || 0,
                adsWatched: s1Data.adsWatched || 0,
                missionsCompleted: (s1Data.missions || []).length,
                upgradesCount: Object.keys(s1Data.upgrades || {}).length
             };
         }
      }

      if (!snap.exists()) {
          // If we had a valid startParam and are verified, process the friend reward!
          let referredBy = null;
          let initialBalance = 10000;
          let referralRewardClaimed = false;

          if (isVerifiedReferral && startParam && startParam.startsWith('ref')) {
             const referrerId = startParam.replace('ref', '');
             const q = query(collection(db, getCollectionName('users')), where('id', '==', referrerId));
             const referrerSnap = await getDocs(q);
             
             if (!referrerSnap.empty) {
                const referrerDoc = referrerSnap.docs[0];
                referredBy = referrerId;
                referralRewardClaimed = true;
                await updateDoc(referrerDoc.ref, {
                   balance: increment(1000000),
                   friendsCount: increment(1)
                });
                initialBalance += 1000000;
             }
          }

          const newUser = {
            id: telegramId,
            username,
            firstName,
            balance: initialBalance,
            energy: 1500,
            profitPerHour: 0,
            role: 'user',
            createdAt: Date.now(),
            lastLogin: Date.now(),
            upgrades: {},
            missions: [],
            friendsCount: 0,
            referredBy,
            referralRewardClaimed,
            adsWatched: 0,
            totalTapped: 0,
            gifts: {},
            tonBalance: 0,
            tonMiningRate: 0,
            lastTonSync: Date.now(),
            tonMiningActiveUntil: 0,
            gramBalance: 0,
            gramMiningRate: 0,
            lastGramSync: Date.now(),
            gramMiningActiveUntil: 0,
            hasClaimedPlushAirdrop: false,
            season1Stats: season1Stats
          };
          
          await setRef(userRef, newUser);
          return newUser;
      } else {
          // Update last login
          await updateDoc(userRef, { lastLogin: Date.now(), username, firstName });
          
          const existingData = snap.data();
          if (season1Stats && !existingData.season1Stats) {
             await updateDoc(userRef, { season1Stats });
             existingData.season1Stats = season1Stats;
          }
          
          return { ...existingData, lastLogin: Date.now(), username, firstName };
      }
    } catch (e) {
      console.error("fetchOrCreateUser User fetch failed: ", e);
      return null;
    }
  },
`;

code = code.replace(/async fetchOrCreateUser[\s\S]*?(?=async syncState)/, replacement);

fs.writeFileSync('src/services/api.ts', code);
