import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTranslation } from 'react-i18next';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet, PlusCircle, Users, Play, Coins, Activity, Send, X, ExternalLink, Copy, Share2, Check, Home, ShieldCheck, Clock, Gamepad2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLoadingScreen } from './components/AppLoadingScreen';
import { AppMiniGame } from './components/AppMiniGame';
import { auth, db, signInAnonymous } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

// FEED names instead of Bots
const MOCK_NAMES = [
  '@Aleksei99', '@mahmoud_ali', '@dimasik_k', '@katya_smirnova', '@omar.khaled', 
  '@samuel_j', '@dr_youssef', '@igor_1985', '@manya_cool', '@vladimir_msk', 
  '@anya_sun', '@tariq_90', '@nassim_z', '@katerina_v', '@said_dz', 
  '@olga_pie', '@sergey_dev', '@yassine_pro', '@max_mustermann', '@lucas_m', 
  '@hassan_22', '@darya_sweet', '@artem_v', '@pavel_88', '@johnny_b', 
  '@amira_art', '@tatyana_s', '@kirill_o', '@farid_66', '@natasha_m',
  '@aziz_king', '@svetlana_k', '@walid_dz', '@anastasia_r', '@yousef_a'
];
const generateWithdrawalAmount = () => {
    const rand = Math.random();
    if (rand > 0.85) return (Math.random() * 90 + 10).toFixed(1); // 10 to 100
    if (rand > 0.98) return (Math.random() * 400 + 100).toFixed(0); // 100 to 500
    return (Math.random() * 8 + 1).toFixed(2); // 1 to 9
};
const generateMockFeed = () => {
  return MOCK_NAMES.map(name => ({
    name,
    amount: generateWithdrawalAmount(),
    id: Math.random().toString(36).substring(7)
  }));
};

export const XpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#xpDrop)">
      {/* Outer Star */}
      <path d="M50 5 L63.5 35 L95 38 L71 60 L78 92 L50 75 L22 92 L29 60 L5 38 L36.5 35 Z" fill="url(#xpOuter)" stroke="#B45309" strokeWidth="3" strokeLinejoin="round" />
      {/* Inner Star */}
      <path d="M50 13 L61 37 L85 39 L66 58 L71 83 L50 70 L29 83 L34 58 L15 39 L39 37 Z" fill="url(#xpInner)" />
      {/* Gloss Highlight */}
      <path d="M50 13 L61 37 L85 39 L50 55 Z" fill="#FFFFFF" fillOpacity="0.4" />
    </g>
    <defs>
      <linearGradient id="xpOuter" x1="50" y1="5" x2="50" y2="92">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="xpInner" x1="50" y1="13" x2="50" y2="83">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <filter id="xpDrop" x="-6" y="-6" width="112" height="112">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
      </filter>
    </defs>
  </svg>
);

export const TonImage = ({ className }: { className?: string }) => (
  <img src="https://i.suar.me/6zQ9x/l" alt="TON" className={`object-contain ${className}`} referrerPolicy="no-referrer" />
);

const LEADERBOARD = [
  { name: '@crypto_king', amount: 2345 },
  { name: '@ton_whale', amount: 1832 },
  { name: '@alex_top', amount: 1540 },
  { name: '@youssef_pro', amount: 1200 },
  { name: '@sarah_btc', amount: 980 },
  { name: '@dmitry_99', amount: 850 },
  { name: '@ivan_investor', amount: 720 },
  { name: '@ahmed_ton', amount: 640 },
  { name: '@elena_x', amount: 500 },
  { name: '@omar_eth', amount: 410 },
];

// Config for conversions
const COST_PER_1200 = 1.0; // 1 TON per 1200 Impressions
const TON_TO_XP_RATE = 1000000; // 1 TON = 1,000,000 XP

export default function App() {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Guest');
  const [points, setPoints] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'ads' | 'invite'>('home');
  
  // Tasks System
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [lastAdDate, setLastAdDate] = useState<string>('');
  const [adTasks, setAdTasks] = useState([
    { id: 't1', title: 'Join CryptoX Channel', reward: 50, link: 'https://t.me/toncoin' },
    { id: 't2', title: 'Follow TON Updates', reward: 50, link: 'https://t.me/toncoin' },
    { id: 't3', title: 'Like Pinned Post', reward: 50, link: 'https://t.me/toncoin' },
  ]);
  
  // Withdraw Modal & Game
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);

  // Ad Form
  const [adName, setAdName] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adImpressions, setAdImpressions] = useState<number>(1200);
  const [createdAds, setCreatedAds] = useState<{id: string, name: string, createdAt: number}[]>([]);
  
  // Logic for live users
  const [liveUsers, setLiveUsers] = useState(2453);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => {
        const change = Math.floor(Math.random() * 9) - 4; // -4 to +4
        const newVal = prev + change;
        return Math.max(2400, Math.min(2600, newVal)); 
      });
    }, 3500); // Changes every 3.5 seconds
    return () => clearInterval(interval);
  }, []);
  const [timeToReset, setTimeToReset] = useState<string>('');

  // Referral state
  const [referralsCount, setReferralsCount] = useState(0);
  const [copied, setCopied] = useState(false);
  // Fallback testing mechanism for browser previews without real telegram
  const getSimulatedUserId = () => {
    let devUserId = localStorage.getItem('tonew_dev_uid');
    if (!devUserId) {
       devUserId = 'dev_' + Math.random().toString(36).substring(7);
       localStorage.setItem('tonew_dev_uid', devUserId);
    }
    return devUserId;
  };

  const userId = WebApp.initDataUnsafe?.user?.id || WebApp.initDataUnsafe?.user?.username || getSimulatedUserId();
  const refLink = `https://t.me/ToNewBot/app?startapp=${userId}`;
  const userWalletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // Live feed
  const [feed, setFeed] = useState(generateMockFeed());

  // Global App Message Modal (Fallback for WebApp.showPopup / showAlert)
  const [appModal, setAppModal] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  const showMessage = (title: string, message: string) => {
    setAppModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    // Load cached tasks state
    const storedLastAd = localStorage.getItem('tonew_last_ad') || '';
    const storedAdsProgress = localStorage.getItem('tonew_ads_progress');
    if (storedLastAd === new Date().toDateString()) {
      setLastAdDate(storedLastAd);
      setAdsWatched(Number(storedAdsProgress) || 0);
    } else {
      setAdsWatched(0);
      setLastAdDate(new Date().toDateString());
    }
    
    const storedTasksStr = localStorage.getItem('tonew_completed_tasks');
    if (storedTasksStr) {
      try {
        setCompletedTasks(JSON.parse(storedTasksStr));
      } catch(e){}
    }

    const storedCreatedAds = localStorage.getItem('tonew_created_ads');
    if (storedCreatedAds) {
      try {
        setCreatedAds(JSON.parse(storedCreatedAds));
      } catch(e){}
    }
    
    // Initialize Web App
    WebApp.ready();
    WebApp.setHeaderColor('#1e293b'); // slate-800
    WebApp.setBackgroundColor('#0f172a'); // slate-900

    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
      setUserName(WebApp.initDataUnsafe.user.username || WebApp.initDataUnsafe.user.first_name || 'User');
    }
    WebApp.expand();

    // Check if joined via referral
    const initFirebaseData = async () => {
      const user = await signInAnonymous();
      if (!user) return; // Auth failed

      const tId = String(userId);
      const userRef = doc(db, 'users', tId);
      const userSnap = await getDoc(userRef);
      
      // Attempt to parse inviter ID from Telegram Context or URL Params (Browser testing fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = WebApp.initDataUnsafe?.start_param || urlParams.get('tgWebAppStartParam') || urlParams.get('startapp');
      const inviterId = startParam ? String(startParam) : null;

      // Handle referral (We process referral if inviter exists AND inviter is not self AND referral doc hasn't been created)
      if (inviterId && inviterId !== tId) {
        const referralRef = doc(db, 'referrals', `${inviterId}_${tId}`);
        const referralSnap = await getDoc(referralRef);
        
        // Only trigger referral bonus once
        if (!referralSnap.exists()) {
           try {
            const inviterRef = doc(db, 'users', inviterId);
             // Give both parties points safely
            await setDoc(referralRef, {
              inviterId: inviterId,
              invitedId: tId,
              createdAt: new Date().toISOString()
            });

            await updateDoc(inviterRef, {
              points: increment(200),
              referralsCount: increment(1)
            });

            // Update local user's points (if their doc exists, update it, else wait for creation)
            if (userSnap.exists()) {
               await updateDoc(userRef, { points: increment(200) });
            }
            WebApp.showAlert(t('refWelcome') || 'Welcome via referral! You received +200 XP.');
           } catch (e) {
             console.error("Referral process error", e);
           }
        }
      }

      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          userId: tId,
          points: (inviterId && inviterId !== tId) ? 500 : 0, // start with 500 if referred
          referralsCount: 0,
          invitedBy: (inviterId && inviterId !== tId) ? inviterId : null,
          createdAt: new Date().toISOString()
        });
      }

      // Realtime listener for this user
      return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPoints(data.points || 0);
          setReferralsCount(data.referralsCount || 0);
        }
      });
    };
    
    let unsubListener: any;
    initFirebaseData().then((unsub) => { unsubListener = unsub; });

    // Live withdrawals rotation
    const interval = setInterval(() => {
      setFeed(prev => {
        const newFeed = [...prev.slice(1), {
          name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
          amount: generateWithdrawalAmount(),
          id: Math.random().toString(36).substring(7)
        }];
        return newFeed;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [t, userId]);

  // Timer Effect
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setTimeToReset(`${h}:${m}:${s}`);
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, []);

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  const watchAd = () => {
    const handleAdSuccess = () => {
      const today = new Date().toDateString();
      let currentWatched = adsWatched;
      if (lastAdDate !== today) {
         currentWatched = 0;
         setLastAdDate(today);
         localStorage.setItem('tonew_last_ad', today);
      }
      
      if (currentWatched < 10) {
         const newWatched = currentWatched + 1;
         setAdsWatched(newWatched);

         const userRewardXP = 100;

         // Firebase Sync
         if (auth.currentUser) {
           updateDoc(doc(db, 'users', String(userId)), { points: increment(userRewardXP) }).catch(console.error);
         } else {
           setPoints((p: number) => p + userRewardXP);
         }
         localStorage.setItem('tonew_ads_progress', newWatched.toString());
         try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      }
    };

    // @ts-ignore
    if (window.Adsgram) {
      try {
        // @ts-ignore
        const AdController = window.Adsgram.init({ blockId: "int-27689" });
        AdController.show().then(() => {
          handleAdSuccess();
        }).catch((e: any) => {
          console.error("Ad failed or skipped", e);
          // Fallback reward for preview environment
          handleAdSuccess();
        });
      } catch (e) {
        console.warn("Adsgram init error (likely not in Telegram environment):", e);
        // Fallback for browser preview
        handleAdSuccess();
      }
    } else {
      handleAdSuccess();
    }
  };

  const completeTask = (taskId: string, reward: number, link: string) => {
    if (!completedTasks.includes(taskId)) {
      WebApp.openTelegramLink(link || 'https://t.me/toncoin');
      setTimeout(() => {
        const newCompleted = [...completedTasks, taskId];
        setCompletedTasks(newCompleted);

        // Firebase Sync
        if (auth.currentUser) {
          updateDoc(doc(db, 'users', String(userId)), { points: increment(reward) }).catch(console.error);
        } else {
          setPoints(p => p + reward);
        }

        localStorage.setItem('tonew_completed_tasks', JSON.stringify(newCompleted));
        WebApp.HapticFeedback.notificationOccurred('success');
      }, 2000);
    }
  };

  const handleWithdraw = () => {
    if (points >= 10000 && withdrawAddress) {
      showMessage(
        t('withdraw') || 'Withdrawal',
        `Withdrawal request sent for address:\n${withdrawAddress}\n\nProcessing takes up to 24 hours.`
      );
      // Firebase Sync
      if (auth.currentUser) {
        updateDoc(doc(db, 'users', String(userId)), { points: increment(-10000) }).catch(console.error);
      } else {
        setPoints(p => p - 10000);
      }
      setIsWalletModalOpen(false);
      setWithdrawAddress('');
    } else {
      showMessage('Alert', t('withdrawMin') || 'Minimum 10,000 XP required.');
    }
  };

  const handlePostAd = async () => {
    if (!userWalletAddress) {
      // Auto trigger the wallet connection modal directly
      tonConnectUI.openModal();
      return;
    }

    if (adImpressions < 1200 || adImpressions > 15000) {
      showMessage('Invalid Amount', 'Impressions must be between 1,200 and 15,000.');
      return;
    }

    const cost = Number(((Number(adImpressions) / 1200) * COST_PER_1200).toFixed(4));
    if (adName && adLink && adImpressions) {
      
      const amountInNano = Math.floor(cost * 1000000000).toString();
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes from now
        messages: [
          {
            address: "UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3",
            amount: amountInNano,
          }
        ]
      };

      try {
        // Send actual TON transaction
        await tonConnectUI.sendTransaction(transaction);
        
        const sheetUrl = 'https://script.google.com/macros/s/AKfycbxHKjqIUtbFhsgftsYRohydXIBIM96t0qAfP9xJ5VXRvrek5tWDyX-ULsXGs72_xpDrZg/exec';
        const formData = new URLSearchParams();
        formData.append('walletAddress', userWalletAddress);
        formData.append('taskName', adName);
        formData.append('taskLink', adLink);
        formData.append('impressions', adImpressions.toString());

        fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        }).catch((e) => console.error('Silent fetch failed', e));

        showMessage(
          t('createAd') || 'Ad Creation',
          `Payment successful for ${cost} TON.\nYour task "${adName}" will be published in 10 hours.`
        );
        
        const newCreatedAd = {
           id: 'adv_' + Math.random().toString(36).substring(7),
           name: adName,
           createdAt: Date.now()
        };
        
        const updatedAds = [newCreatedAd, ...createdAds];
        setCreatedAds(updatedAds);
        localStorage.setItem('tonew_created_ads', JSON.stringify(updatedAds));

        setAdName('');
        setAdLink('');
        setAdImpressions(1200);
        
        WebApp.HapticFeedback.notificationOccurred('success');
      } catch (error: any) {
        // Specifically look for user rejection errors to fail silently without alarming console errors or popups
        const errorMessage = typeof error === 'string' ? error : error?.message || '';
        if (errorMessage.includes('reject') || errorMessage.includes('decline') || error?.name?.includes('UserRejectsError')) {
           // Do nothing, fail silently as the user intentionally cancelled
        } else {
           console.error("Payment error:", error);
           showMessage('Payment Failed', 'An error occurred with the transaction. Please try again.');
        }
      }
    } else {
        showMessage('Error', 'Please fill all fields.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = t('inviteFriendsDesc');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    WebApp.openTelegramLink(shareUrl);
  };

  const simulateReferralJoin = () => {
    setReferralsCount(prev => prev + 1);
    setPoints(prev => prev + 500);
    // Silent notification instead of alert for better UX
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-900 text-slate-100 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {isLoading && <AppLoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOpen && (
           <AppMiniGame 
             onClose={() => setIsGameOpen(false)} 
             onEarn={(xp) => {
               if (auth.currentUser) {
                 updateDoc(doc(db, 'users', String(userId)), { points: increment(xp) }).catch(console.error);
               } else {
                 setPoints(p => p + xp);
               }
             }} 
           />
        )}
      </AnimatePresence>

      {/* 1. Header Area (Fixed Top) */}
      <header className="shrink-0 flex justify-between items-center px-4 py-3 bg-slate-800 rounded-b-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-40 relative">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 p-[2px] shadow-lg">
             <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center">
                <span className="font-extrabold text-lg text-slate-200">{userName.charAt(0).toUpperCase()}</span>
             </div>
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-sm leading-tight text-white mb-0.5 max-w-[100px] truncate">{userName}</span>
             <span className="text-[10px] text-yellow-400 font-extrabold tracking-widest uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded-md inline-block w-max">
                {t('lvlNewbie')}
             </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center space-y-1">
          <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-700/50 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-green-300"></span>
              <span className="text-[10px] font-bold text-green-400 tracking-wider font-mono">{liveUsers.toLocaleString()} online</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <select 
              value={i18n.language} 
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-slate-700 text-[10px] font-bold border-none rounded-lg px-1.5 py-1 outline-none focus:ring-1 focus:ring-cyan-500 transition-shadow appearance-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="ar">AR</option>
            </select>
            <TonConnectButton className="!scale-[0.60] origin-right rtl:origin-left" />
          </div>
        </div>
      </header>

      {/* 2. Marquee Live Feed */}
      <div className="shrink-0 bg-slate-800/60 border-b border-slate-700/50 py-1.5 px-4 flex items-center z-30 shadow-inner">
        <div className="flex items-center text-[10px] font-bold text-slate-300 bg-slate-900/50 px-2 flex-shrink-0 z-10 border-r rtl:border-l rtl:border-r-0 border-slate-600 mr-2 rtl:ml-2 rtl:mr-0 h-5 leading-5 rounded-md">
          <Activity className="w-3 h-3 text-emerald-400 mr-1.5 rtl:ml-1.5 rtl:mr-0 animate-pulse" />
          {t('weeklyWithdrawals')}
        </div>
        <div className="flex-1 overflow-hidden relative h-4">
          <AnimatePresence>
            <motion.div
              key={feed[0].id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="absolute whitespace-nowrap text-[11px] font-medium text-slate-300"
            >
              {feed[0].name} {t('withdrew')} <span className="font-bold text-cyan-400 inline-flex items-center ml-1 rtl:mr-1 rtl:ml-0">{feed[0].amount} <TonImage className="w-3 h-3 ml-1 rtl:mr-1 rtl:ml-0 translate-y-[-1px]" /></span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Main Content Area */}
      {/* Hide scrollbar with Tailwind utilities while allowing scroll */}
      <main className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col">
        
        {/* === HOME TAB === */}
        {activeTab === 'home' && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="flex flex-col space-y-4 h-full">
            
            {/* Giant Points Box */}
            <div className="bg-gradient-to-b from-cyan-600 to-indigo-700 rounded-[32px] p-6 border-b-[6px] border-indigo-900 shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center mt-2">
               <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-cyan-400/20 rounded-full blur-xl"></div>
               
               <div className="flex items-center justify-center mb-1 mt-4">
                 <h2 
                   className="text-[3.25rem] font-black font-mono text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] tracking-tighter leading-none"
                   style={{
                     backgroundImage: 'linear-gradient(to bottom, #FDE047 30%, #F59E0B 70%, #B45309 100%)',
                   }}
                 >
                   {points.toLocaleString()}
                 </h2>
                 <XpIcon className="w-14 h-14 ml-2.5 rtl:mr-2.5 rtl:ml-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform hover:scale-105 transition-transform translate-y-[-2px]" />
               </div>
               <p className="text-cyan-100 text-xs font-bold uppercase mt-2 tracking-wider">{t('pointsBalance')}</p>
            </div>

            <div className="flex flex-col gap-3">
               {/* Withdraw Button */}
               <button 
                 onClick={() => setIsWalletModalOpen(true)}
                 className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-emerald-800 shadow-[0_4px_12px_rgba(16,185,129,0.3)] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center text-sm"
               >
                 <Wallet className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 drop-shadow-sm" /> 
                 {t('withdraw')}
               </button>

               {/* Play Game Button */}
               <button 
                 onClick={() => setIsGameOpen(true)}
                 className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-amber-800 shadow-[0_4px_12px_rgba(245,158,11,0.3)] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center text-sm"
               >
                 <Gamepad2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 drop-shadow-sm" /> 
                 Play Game
               </button>
            </div>

            {/* Stats Overview */}
            <div className="bg-slate-800 rounded-3xl p-4 border border-slate-700 w-full mt-auto">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                 <ShieldCheck className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                 {t('statistics')}
               </h3>
               <div className="flex justify-between items-center text-sm">
                 <div className="flex flex-col">
                   <span className="font-bold text-white">{referralsCount}</span>
                   <span className="text-[10px] text-slate-500 font-medium uppercase">{t('navFriends')}</span>
                 </div>
                 <div className="h-6 w-px bg-slate-700"></div>
                 <div className="flex flex-col items-center">
                   <span className="font-bold text-white">{completedTasks.length}</span>
                   <span className="text-[10px] text-slate-500 font-medium uppercase">{t('completedTasks')}</span>
                 </div>
                 <div className="h-6 w-px bg-slate-700"></div>
                 <button onClick={() => setIsLeaderboardOpen(true)} className="flex flex-col items-end group">
                   <span className="font-bold text-cyan-400 group-active:scale-95 transition-transform flex items-center">
                     #{Math.max(1, 100000 - points - (completedTasks.length * 56) - (referralsCount * 120)).toLocaleString()} <TonImage className="w-3 h-3 ml-1 rtl:mr-1 rtl:ml-0 drop-shadow-sm opacity-0 hidden" />
                   </span>
                   <span className="text-[10px] text-slate-500 font-medium uppercase group-active:text-cyan-400">Rnk</span>
                 </button>
               </div>
            </div>

          </motion.div>
        )}

        {/* === TASKS TAB === */}
        {activeTab === 'tasks' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-5 pb-4">
            
            <div className="text-center py-2">
              <h2 className="text-2xl font-extrabold text-white mb-1">{t('navEarn')}</h2>
              <p className="text-sm text-slate-400">{t('earnMore')}</p>
            </div>

            {/* Daily Task Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center">
                <Play className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-pink-400" />
                {t('dailyTask')}
              </h3>
              
              <div className="bg-slate-800 rounded-[24px] p-2 border-b-[4px] border-slate-900 shadow-md flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 shadow-inner">
                    <Play className="fill-white text-white w-6 h-6" />
                  </div>
                  <div className="flex-1 pr-2 rtl:pl-2 rtl:pr-0">
                    <p className="font-extrabold text-sm text-slate-100">{t('watchAds')} <span className="text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded ml-1 font-mono text-pink-300">{adsWatched}/10</span></p>
                    <p className="text-xs font-bold text-pink-400 mt-1 bg-pink-400/10 inline-flex items-center px-2 py-0.5 rounded-md drop-shadow-sm">+100 <XpIcon className="w-4 h-4 ml-1.5" /></p>
                  </div>
                </div>
                {adsWatched >= 10 && lastAdDate === new Date().toDateString() ? (
                  <button disabled className="bg-slate-700 text-slate-300 font-extrabold py-2 px-4 rounded-xl border-b-[3px] border-slate-800 transition-all text-xs shrink-0 cursor-not-allowed flex flex-col items-center justify-center min-w-[80px]">
                    <Clock className="w-4 h-4 mb-0.5 opacity-60" />
                    <span className="font-mono tracking-wider opacity-80">{timeToReset}</span>
                  </button>
                ) : (
                  <button onClick={watchAd} className="bg-pink-500 text-white font-extrabold py-2.5 px-6 rounded-xl border-b-[3px] border-pink-700 active:border-b-0 active:translate-y-[3px] transition-all text-sm shrink-0">
                    {t('claim')}
                  </button>
                )}
              </div>
            </div>

            {/* Premium Tasks Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center">
                <Coins className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-cyan-400" />
                {t('otherTasks')}
              </h3>
              
              <div className="space-y-3">
                {adTasks.map((task, idx) => {
                  const isDone = completedTasks.includes(task.id);
                  return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`bg-slate-800 rounded-[24px] p-2 border-b-[4px] border-slate-900 shadow-md flex items-center justify-between ${isDone ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center flex-1 overflow-hidden">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 shadow-inner shrink-0 ${isDone ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                          {isDone ? <Check className="text-emerald-400 w-5 h-5" /> : <ExternalLink className="text-white w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
                          <p className={`font-extrabold text-sm truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{task.title}</p>
                          <p className={`text-xs font-bold mt-1 inline-flex items-center px-2 py-0.5 rounded-md drop-shadow-sm ${isDone ? 'text-slate-500 bg-slate-700/50' : 'text-cyan-400 bg-cyan-400/10'}`}>
                            +{task.reward} <XpIcon className="w-4 h-4 ml-1.5" />
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => !isDone && completeTask(task.id, task.reward, task.link)}
                        disabled={isDone}
                        className={`font-extrabold rounded-xl border-b-[3px] transition-all text-sm shrink-0 px-5 py-2.5 ${
                          isDone 
                          ? 'bg-slate-700 text-slate-500 border-slate-800 cursor-not-allowed' 
                          : 'bg-cyan-500 text-white border-cyan-700 active:border-b-0 active:translate-y-[3px]'
                        }`}
                      >
                        {isDone ? t('taskDone') : t('claim')}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* === POST ADS TAB === */}
        {activeTab === 'ads' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4">
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
                <Send className="w-8 h-8 text-white ml-[-2px] mt-[2px]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">{t('createAd')}</h2>
              <p className="text-sm font-medium text-purple-300">{t('impressionsRate')}</p>
            </div>

            <div className="bg-slate-800 rounded-[28px] p-5 shadow-lg border border-slate-700/50 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('taskName')}</label>
                <input 
                  type="text" 
                  value={adName}
                  onChange={(e) => setAdName(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('taskLink')}</label>
                <input 
                  type="url" 
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('impressions')}</label>
                <div className="flex bg-slate-900 border-2 border-slate-700 rounded-2xl p-1 justify-between items-center focus-within:border-purple-500 transition-colors">
                  <button 
                    onClick={() => setAdImpressions(prev => Math.max(1200, (Number(prev) || 1200) - 100))}
                    className="w-10 h-10 bg-slate-800 rounded-xl text-slate-300 font-bold flex items-center justify-center hover:bg-slate-700 hover:text-white active:scale-95 transition-all text-xl"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    min={1200}
                    max={15000}
                    value={adImpressions || ''}
                    onChange={(e) => setAdImpressions(Number(e.target.value))}
                    className="w-full bg-transparent px-2 py-2 font-mono text-lg font-bold text-white text-center focus:outline-none placeholder-slate-600"
                    placeholder="1200"
                  />
                  <button 
                    onClick={() => setAdImpressions(prev => Math.min(15000, (Number(prev) || 1200) + 100))}
                    className="w-10 h-10 bg-slate-800 rounded-xl text-slate-300 font-bold flex items-center justify-center hover:bg-slate-700 hover:text-white active:scale-95 transition-all text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Limits: 1.2K - 15K</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAdImpressions(1200)}
                      className="text-[10px] bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 hover:text-white active:scale-95 transition-all uppercase tracking-widest"
                    >
                      Min
                    </button>
                    <button 
                      onClick={() => setAdImpressions(15000)}
                      className="text-[10px] bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 hover:text-white active:scale-95 transition-all uppercase tracking-widest"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={handlePostAd}
                className="w-full mt-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-indigo-700 shadow-lg active:border-b-0 active:translate-y-[4px] transition-all flex justify-center items-center text-sm"
              >
                {t('withdrawPost')}
                {adImpressions && Number(adImpressions) >= 1200 && (
                  <span className="ml-2 flex items-center rtl:mr-2 rtl:ml-0 bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                    {Number(((Number(adImpressions) / 1200) * COST_PER_1200).toFixed(4))} <TonImage className="w-3.5 h-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                  </span>
                )}
              </button>
            </div>

            {createdAds.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center">
                  <Activity className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-indigo-400" />
                  {t('myCampaigns') || 'My Campaigns'}
                </h3>
                <div className="space-y-3">
                  {createdAds.map(ad => {
                    const hoursPassed = (Date.now() - ad.createdAt) / (1000 * 60 * 60);
                    const isPublished = hoursPassed >= 10;
                    return (
                      <div key={ad.id} className="bg-slate-800 rounded-2xl p-4 border-l-[4px] border-indigo-500 shadow-md">
                        <p className="font-bold text-sm text-white mb-2">{ad.name}</p>
                        {isPublished ? (
                          <span className="text-emerald-400 text-xs font-bold flex items-center">
                            <Check className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Published ✅
                          </span>
                        ) : (
                          <span className="text-amber-400 text-xs font-bold flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 animate-pulse" /> Will be published in 10 hours
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* === INVITE TAB === */}
        {activeTab === 'invite' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4">
             <div className="text-center py-2 font-sans">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_rgba(245,158,11,0.4)]">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">{t('inviteFriends')}</h2>
              <p className="text-sm font-medium text-orange-200">{t('inviteFriendsDesc')}</p>
            </div>

            <div className="bg-slate-800 rounded-[28px] p-5 border border-slate-700/50 shadow-lg mt-2 text-center">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('referralsCount', { count: referralsCount })}</h3>
              <div className="text-4xl font-extrabold font-mono text-white mb-6">
                {referralsCount}
              </div>

              <div className="text-left rtl:text-right mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('yourRefLink')}</label>
                <div className="flex bg-slate-900 border-2 border-slate-700 rounded-2xl p-1.5">
                  <input 
                    type="text" 
                    readOnly
                    value={refLink}
                    className="w-full bg-transparent px-3 text-sm font-medium focus:outline-none text-slate-300 truncate"
                  />
                  <button 
                    onClick={() => handleCopy(refLink)}
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors shrink-0 flex items-center justify-center font-bold"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-200" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-blue-700 shadow-lg active:border-b-0 active:translate-y-[4px] transition-all flex justify-center items-center text-sm"
                >
                  <Share2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('share')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* 4. Bottom Navbar Area */}
      <nav className="shrink-0 bg-slate-800 rounded-t-[32px] px-6 pb-safe border-t border-slate-700/50 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] z-40 relative">
        <div className="flex justify-between items-end h-20 pb-4 pt-2">
          
          <button onClick={() => setActiveTab('home')} className="flex flex-col items-center justify-end w-16 relative group">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'home' ? 'bg-cyan-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-cyan-300'}`}>
              <Home className={`w-6 h-6 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'home' ? 'text-cyan-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navHome')}</span>
          </button>

          <button onClick={() => setActiveTab('tasks')} className="flex flex-col items-center justify-end w-16 relative group">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'tasks' ? 'bg-pink-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-pink-300'}`}>
              <Coins className={`w-6 h-6 transition-transform ${activeTab === 'tasks' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'tasks' ? 'text-pink-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navEarn')}</span>
          </button>

          <button onClick={() => setActiveTab('ads')} className="flex flex-col items-center justify-end w-16 relative group">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'ads' ? 'bg-purple-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-purple-300'}`}>
              <PlusCircle className={`w-6 h-6 transition-transform ${activeTab === 'ads' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'ads' ? 'text-purple-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navPromote')}</span>
          </button>

          <button onClick={() => setActiveTab('invite')} className="flex flex-col items-center justify-end w-16 relative group">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'invite' ? 'bg-orange-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-orange-300'}`}>
               <Users className={`w-6 h-6 transition-transform ${activeTab === 'invite' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'invite' ? 'text-orange-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navFriends')}</span>
          </button>

        </div>
      </nav>

      {/* WAALLET MODAL (Absoute overlay to stay on top but not break navigation layout if we don't want) */}
      <AnimatePresence>
        {isWalletModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 border-2 border-slate-700 rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white bg-slate-700 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white">{t('withdraw')}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center justify-center">
                  {t('withdrawRate')} <TonImage className="w-3 h-3 ml-1 translate-y-[-1px]" />
                </p>
                <p className="text-xs text-emerald-400 mt-1 font-bold bg-emerald-400/10 flex items-center justify-center px-2 py-0.5 rounded-md mx-auto w-max">
                  {t('withdrawMin')} <TonImage className="w-3 h-3 ml-1" />
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('walletAddress')}</label>
                  <input 
                    type="text" 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="EQ..."
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={handleWithdraw}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-green-800 shadow-lg active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  {t('withdraw')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isLeaderboardOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <button onClick={() => setIsLeaderboardOpen(false)} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full z-10">
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-5 shrink-0">
                <h3 className="text-xl font-extrabold text-white flex items-center justify-center">
                  <span className="text-yellow-400 mr-2 drop-shadow-md">🏆</span> {t('rnkTopLeaders')}
                </h3>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                {LEADERBOARD.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black mr-3 shadow-inner text-xs ${idx === 0 ? 'bg-yellow-400 text-slate-900' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        #{idx + 1}
                      </div>
                      <span className="font-extrabold text-sm text-white font-mono">{user.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold flex items-center text-cyan-400 drop-shadow-sm text-sm">
                        {user.amount} <TonImage className="w-3.5 h-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('drawnAmount')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Message Modal / Popup Replacement */}
      <AnimatePresence>
        {appModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border-2 border-slate-700/50 p-6 rounded-[28px] shadow-2xl max-w-sm w-full relative"
            >
              <h3 className="text-xl font-extrabold text-white mb-3 text-center">{appModal.title}</h3>
              <p className="text-slate-300 text-sm font-medium whitespace-pre-line leading-relaxed mb-6 text-center">
                {appModal.message}
              </p>
              <button 
                onClick={() => setAppModal({ isOpen: false, title: '', message: '' })}
                className="w-full bg-cyan-500 text-white font-extrabold py-3.5 rounded-2xl border-b-[4px] border-cyan-700 shadow-lg active:border-b-0 active:translate-y-[4px] transition-all text-sm"
              >
                {t('close') || 'OK'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {isLeaderboardOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLeaderboardOpen(false)} />
            <div className="bg-slate-800 rounded-t-[32px] p-5 pb-8 shadow-2xl relative border-t-2 border-slate-700 w-full max-h-[85vh] flex flex-col">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white flex items-center">
                  <Trophy className="w-6 h-6 text-yellow-500 mr-2 rtl:ml-2 rtl:mr-0" />
                  Leaderboard
                </h3>
                <button onClick={() => setIsLeaderboardOpen(false)} className="p-2 bg-slate-700/50 rounded-full text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Simulated Leaderboard Data */}
                {[
                  { name: MOCK_NAMES[0], score: 4520000 },
                  { name: MOCK_NAMES[1], score: 3890000 },
                  { name: MOCK_NAMES[2], score: 3254000 },
                  { name: userName, score: points, isMe: true }, // Current user injected
                  { name: MOCK_NAMES[3], score: 2900000 },
                  { name: MOCK_NAMES[4], score: 1850000 },
                  { name: MOCK_NAMES[5], score: 1420000 },
                  { name: MOCK_NAMES[6], score: 980000 },
                ]
                .sort((a, b) => b.score - a.score)
                .map((user, idx) => (
                  <div key={user.name + idx} className={`flex items-center justify-between p-3 rounded-2xl border-l-[4px] ${user.isMe ? 'bg-indigo-900/40 border-indigo-500 shadow-md' : 'bg-slate-900/50 border-slate-700'}`}>
                     <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 rtl:ml-3 rtl:mr-0 ${idx === 0 ? 'bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                           #{idx + 1}
                        </div>
                        <span className={`font-bold text-sm ${user.isMe ? 'text-indigo-300' : 'text-slate-300'}`}>
                           {user.isMe ? `${user.name} (You)` : user.name}
                        </span>
                     </div>
                     <span className="font-mono font-bold text-amber-400 text-sm">
                        {user.score.toLocaleString()} XP
                     </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
