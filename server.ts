import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cron from 'node-cron';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for the backend script
let fbApp: any, fbAuth: any, fbDb: any;
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    fbApp = initializeApp(config);
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp, config.firestoreDatabaseId); // Needs databaseId if custom provided
  } catch (e) {
    console.error("Could not parse firebase config for backend.", e);
  }
}

async function runPeriodicBroadcast() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN || !fbDb) return;

  try {
    const sysRef = doc(fbDb, 'system', 'usersList');
    const snap = await getDoc(sysRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const uids = data.uids || [];
    const lastSent = data.lastBroadcastAt || 0;

    // Check if 8 hours have passed (with a 5 minute margin for overlap tolerance)
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (Date.now() - lastSent < (EIGHT_HOURS - 300000)) {
       // Not enough time has passed
       return;
    }

    // Update the record to prevent other instances from duplicating
    await updateDoc(sysRef, { lastBroadcastAt: Date.now() });
    
    console.log(`Starting automated broadcast to ${uids.length} users...`);

    const payload = {
        photo: 'https://i.suar.me/dgW2J/l',
        caption: '🔥 أهلاً بك من جديد! لا تفوت فرصة إنجاز مهامك اليومية وجمع الأرباح داخل التطبيق.\n\nاضغط على الزر بالأسفل للعودة لتطبيقك وجمع مكافآتك الآن! 🚀',
        reply_markup: {
           inline_keyboard: [[{
              text: 'Open Web App ✨',
              web_app: { url: 'https://splendid-starship-5a763b.netlify.app/' }
           }]]
        }
    };

    let sent = 0, failed = 0;
    for (const chat_id of uids) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, ...payload })
          });
          if (res.ok) sent++; else failed++;
        } catch {
          failed++;
        }
        await new Promise(r => setTimeout(r, 40)); // Throttle: max 25 msg/s
    }
    console.log(`Auto broadcast complete. Sent: ${sent}, Failed: ${failed}`);

  } catch (err) {
    console.error("Auto broadcast error:", err);
  }
}

// Schedule cron to evaluate every 15 minutes checking if the 8 hours differ.
// This is done so that even if the server sleeps exactly on the 8h mark,
// it will run reasonably soon once it's woken up by traffic again.
cron.schedule('*/15 * * * *', () => {
    runPeriodicBroadcast();
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing middleware
  app.use(express.json());

  // Webhook for Telegram Bot
  app.post('/api/bot/webhook', async (req, res) => {
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (!TELEGRAM_BOT_TOKEN) {
        console.error("No token configured.");
        return res.sendStatus(500);
      }

      const update = req.body;
      if (update && update.message && update.message.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id;

        // If user presses /start
        if (text.startsWith('/start')) {
          const payload = {
            chat_id: chatId,
            photo: 'https://i.suar.me/dgW2J/l',
            caption: '🔥 Dive back into the adventure! Do not miss out on your daily tasks and exclusive rewards.\n\nTap the button below to launch the App and claim your bonuses now! 🚀',
            reply_markup: {
               inline_keyboard: [[{
                  text: 'Open Web App ✨',
                  web_app: { url: 'https://splendid-starship-5a763b.netlify.app/' }
               }]]
            }
          };

          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      res.sendStatus(200); // Must acknowledge to Telegram
    } catch (err) {
      console.error("Webhook error:", err);
      res.sendStatus(500);
    }
  });

  // Expose an endpoint to easily set the webhook
  app.get('/api/bot/set-webhook', async (req, res) => {
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      // Get the domain from request headers
      let domain = req.headers['x-forwarded-host'] || req.headers.host;
      if (!domain) {
          domain = "ais-pre-oq6kog4ubxn654yifama25-224035158297.europe-west3.run.app";
      }
      const webhookUrl = `https://${domain}/api/bot/webhook`;
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
      
      const response = await fetch(url);
      const data = await response.json();
      res.json({ webhookUrl, telegramResponse: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Check if a broadcast is due shortly after startup
    setTimeout(runPeriodicBroadcast, 5000);
  });
}

startServer();
