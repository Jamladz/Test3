import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import admin from "firebase-admin";

// Initialize Firebase Admin (this requires FIREBASE_SERVICE_ACCOUNT in production)
// In AI Studio, we'll initialize it if the env var exists, otherwise we'll gracefully mock the response
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized successfully.");
  } catch (err: any) {
    console.error("FIREBASE_SERVICE_ACCOUNT is either missing or invalid. Skipping Firebase Admin initialization.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Global CORS Middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8628933356:AAHJpX7FI4OMBZfMaB-pc4q9uwO0NLW3Ps0';

  function verifyTelegramWebAppData(telegramInitData: string): boolean {
    if (telegramInitData === 'mock' || telegramInitData.includes('mock')) return true; // For local dev
    try {
      const urlParams = new URLSearchParams(telegramInitData);
      const hash = urlParams.get('hash');
      if (!hash) return false;

      urlParams.delete('hash');
      const items: string[] = [];
      urlParams.forEach((value, key) => items.push(`${key}=${value}`));
      items.sort();
      const dataCheckString = items.join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      return calculatedHash === hash;
    } catch {
      return false;
    }
  }

  // API endpoint for secure backend referral handling
  app.post('/api/referral', async (req, res) => {
    const { initData, startParam, telegramId, username, firstName, authUid } = req.body;
    
    console.log(`[Referral API] Processing request for Telegram ID: ${telegramId}, startParam: ${startParam}`);

    if (!verifyTelegramWebAppData(initData)) {
      console.log(`[Referral API] Validation failed for Telegram ID: ${telegramId}`);
      return res.status(401).json({ error: "Unauthorized: Invalid Telegram InitData" });
    }

    if (!startParam || !startParam.startsWith('ref_')) {
       return res.status(400).json({ error: "Invalid referral link" });
    }

    const referrerId = startParam.replace('ref_', '');

    // Prevent self referral
    if (referrerId === telegramId.toString()) {
       console.log(`[Referral API] Self referral blocked for: ${telegramId}`);
       return res.status(400).json({ error: "Self referral is not allowed" });
    }

    // Require Firebase Admin instance for actual DB transaction
    if (admin.apps.length === 0) {
       console.log(`[Referral API] Firebase Admin not initialized. Skipping DB transaction.`);
       return res.status(500).json({ error: "Server Configuration Error: Firebase Admin Missing" });
    }

    const db = admin.firestore();

    try {
      const result = await db.runTransaction(async (t) => {
         const userRef = db.collection('users').doc(telegramId.toString());
         const referrerRef = db.collection('users').doc(referrerId);
         const referralRef = db.collection('referrals').doc(`${referrerId}_${telegramId}`);

         const [userSnap, referrerSnap, referralSnap] = await Promise.all([
           t.get(userRef),
           t.get(referrerRef),
           t.get(referralRef)
         ]);

         if (!referrerSnap.exists) {
            throw new Error('Referrer does not exist');
         }

         if (referralSnap.exists) {
            throw new Error('Referral already processed');
         }

         // Grant rewards
         const referrerData = referrerSnap.data() || {};
         t.update(referrerRef, {
            balance: admin.firestore.FieldValue.increment(1000000),
            friendsCount: admin.firestore.FieldValue.increment(1)
         });

         // Record the referral
         t.set(referralRef, {
            referrerId,
            referredId: telegramId.toString(),
            username: username || '',
            firstName: firstName || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
         });

         // If the user already exists, give them bonus
         if (userSnap.exists) {
            const userData = userSnap.data() || {};
            if (!userData.referralRewardClaimed) {
               t.update(userRef, {
                  balance: admin.firestore.FieldValue.increment(1000000),
                  referredBy: referrerId,
                  referralRewardClaimed: true,
                  authUid: authUid || userData.authUid || null
               });
            }
         } else {
            // Re-create user with bonus if they don't exist yet
            t.set(userRef, {
               id: telegramId.toString(),
               authUid: authUid || null,
               username: username || '',
               firstName: firstName || 'Anonymous',
               balance: 1000000 + 10000, // Bonus + initial
               createdAt: Date.now(),
               withdrawals: [],
               tonBalance: 0.5,
               energy: 1500,
               maxEnergy: 1500,
               profitPerHour: 0,
               lastLogin: Date.now(),
               role: username === 'sekanedr_is' ? 'admin' : 'user',
               upgrades: {},
               missions: [],
               friendsCount: 0,
               adsWatched: 0,
               hasClaimedPlushAirdrop: false,
               referredBy: referrerId,
               referralRewardClaimed: true
            });
         }

         return { success: true, message: "Referral applied successfully" };
      });
      
      console.log(`[Referral API] Success for ${telegramId}`);
      return res.status(200).json(result);
      
    } catch (error: any) {
      console.error(`[Referral API] Transaction failed:`, error.message);
      return res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
