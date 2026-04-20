import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTranslation } from 'react-i18next';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet, PlusCircle, Users, Play, Coins, Activity, Send, X, ExternalLink, Copy, Share2, Check, Home, ShieldCheck, Clock, Gamepad2, Trophy, Bell, FileText, Megaphone, Gift, ChevronRight, Folder, Globe, ArrowRightLeft, Sparkles, RefreshCw, Instagram, Youtube, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLoadingScreen } from './components/AppLoadingScreen';
import { AppMiniGame } from './components/AppMiniGame';
import { auth, db, signInAnonymous } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot, writeBatch, arrayUnion } from 'firebase/firestore';

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

export const SocialIcon = ({ type, className }: { type?: string, className?: string }) => {
  if (type === 'instagram') return <Instagram className={className} />;
  if (type === 'youtube') return <Youtube className={className} />;
  if (type === 'telegram') return <Send className={className} />;
  if (type === 'tiktok') return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
       <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.94-1.69-.17-.14-.33-.28-.48-.43v6.57c.02 2.57-.73 5.31-3.07 6.78-2.61 1.68-6.4 1.4-8.4-1.12-1.77-2.22-1.2-5.91.95-7.56 1.44-1.12 3.33-1.32 5-1.04v4.03c-1.13-.19-2.34-.03-3.21.78-.9.84-.71 2.37.28 2.94.99.57 2.41.34 3.01-.65.25-.41.35-.9.34-1.38V.02h.02z" />
    </svg>
  );
  return <ExternalLink className={className} />;
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

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  iconType: 'update' | 'gift' | 'alert' | 'event';
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: '🚀 Major Update v2.0',
    content: 'Welcome to the new version! We have added new mini-games, increased the referral bonus, and improved the overall speed of the application. Enjoy the lightning-fast experience.',
    date: 'Just now',
    isRead: false,
    iconType: 'update'
  },
  {
    id: 'n2',
    title: '🎁 Weekend Bonus Event',
    content: "From Friday to Sunday, all tasks grant double XP! Don't miss this chance to rank up on the leaderboard faster than ever.",
    date: '2 hours ago',
    isRead: false,
    iconType: 'event'
  },
  {
    id: 'n3',
    title: '🔒 Security Enhanced',
    content: 'We have upgraded our anti-bot system. Fair play is guaranteed. Any suspicious accounts will be penalized to protect our genuine users.',
    date: '1 day ago',
    isRead: true,
    iconType: 'alert'
  },
  {
    id: 'n4',
    title: '💸 Withdrawal Limits Lowered',
    content: 'Great news! We reduced the minimum withdrawal limit. You can now withdraw starting from 0.5 TON straight to your wallet.',
    date: '3 days ago',
    isRead: true,
    iconType: 'gift'
  }
];

// Config for conversions
const COST_PER_1200 = 1.0; // 1 TON per 1200 Impressions
const TON_TO_XP_RATE = 1000000; // 1 TON = 1,000,000 XP

export default function App() {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Guest');
  // --- Updated: LocalStorage State Management ---
  const loadState = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(`tonew_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const saveState = (key: string, value: any) => {
    localStorage.setItem(`tonew_${key}`, JSON.stringify(value));
  };

  const [points, setPoints] = useState<number>(() => loadState('points', 0));
  const [tonBalance, setTonBalance] = useState<number>(() => loadState('tonBalance', 0));
  const [adsWatched, setAdsWatched] = useState<number>(() => loadState('adsWatched', 0));
  const [lastAdClaimDate, setLastAdClaimDate] = useState<string>(() => loadState('lastAdClaimDate', ''));
  const [wheelAdsWatched, setWheelAdsWatched] = useState<number>(() => loadState('wheelAdsWatched', 0));
  const [lastWheelDate, setLastWheelDate] = useState<string>(() => loadState('lastWheelDate', ''));

  useEffect(() => {
    saveState('points', points);
    saveState('tonBalance', tonBalance);
    saveState('adsWatched', adsWatched);
    saveState('lastAdClaimDate', lastAdClaimDate);
    saveState('wheelAdsWatched', wheelAdsWatched);
    saveState('lastWheelDate', lastWheelDate);
  }, [points, tonBalance, adsWatched, lastAdClaimDate, wheelAdsWatched, lastWheelDate]);

  // --- Updated Ad Logic ---
  const triggerAd = async () => {
    const today = new Date().toDateString();
    
    // Check 3/3 daily limit using LocalStorage
    if (lastAdClaimDate === today && adsWatched >= WATCH_LIMIT) {
       return; // Silently do nothing if limit reached
    }

    const Adsgram = (window as any).Adsgram;
    if (Adsgram) {
      setIsAdLoading(true);
      try {
        const AdController = Adsgram.init({ blockId: ADS_WATCH_ID });
        await AdController.show();
        
        // 24H Cooldown logic: reset if new day, otherwise increment
        const newWatched = (lastAdClaimDate === today ? adsWatched : 0) + 1;
        setAdsWatched(newWatched);
        setLastAdClaimDate(today);

        setIsAdLoading(false);
      } catch (e: any) {
        setIsAdLoading(false);
      }
    }
  };

  const triggerWheelAd = async () => {
    const today = new Date().toDateString();
    if (wheelAdsWatched >= 3 && lastWheelDate === today) {
      return; // Daily limit 3
    }
    
    const Adsgram = (window as any).Adsgram;
    if (Adsgram) {
      setIsAdLoading(true);
      try {
        const AdController = Adsgram.init({ blockId: ADS_WHEEL_ID });
        await AdController.show();
        
        const newWatched = (lastWheelDate === today ? wheelAdsWatched : 0) + 1;
        setWheelAdsWatched(newWatched);
        setLastWheelDate(today);
        setAdSpinsCount(prev => prev + 1);
        
        setIsAdLoading(false);
      } catch (e: any) {
        setIsAdLoading(false);
      }
    }
  };

  const claimAdReward = () => {
    const today = new Date().toDateString();
    // Claim 100 XP only if 3/3 and not yet claimed today
    if (adsWatched >= WATCH_LIMIT && lastAdClaimDate !== today) {
      setPoints(p => p + XP_REWARD_AFTER_3);
      setLastAdClaimDate(today);
      WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const spinWheel = async () => {
    const today = new Date().toDateString();
    // 24h limit check: 1 free, +3 from ads
    if (lastWheelDate === today && adSpinsCount <= 0) {
      return;
    }

    const rewards = [
      { label: '5 XP', type: 'xp', value: 5 },
      { label: '10 XP', type: 'xp', value: 10 },
      { label: '15 XP', type: 'xp', value: 15 },
      { label: '0.005 TON', type: 'ton', value: 0.005 },
    ];
    const selected = rewards[Math.floor(Math.random() * rewards.length)];

    if (selected.type === 'xp') setPoints(p => p + selected.value);
    else setTonBalance(b => b + selected.value);
    
    // Consume spin
    if (lastWheelDate !== today) setLastWheelDate(today);
    else setAdSpinsCount(prev => prev - 1);
    
    return selected;
  };
  const [adTasks, setAdTasks] = useState([
    { id: 'miniapp_gamee', title: 'Play Gamee Mini App', reward: 100, link: 'https://t.me/gamee/start?startapp=eyJyZWYiOjEzNjg4OTk4NDJ9', type: 'telegram' },
    { id: 'yt_whiteboard', title: 'Sub Whiteboard Crypto', reward: 50, link: 'https://youtube.com/@whiteboardcrypto?si=EqK3R0Ch_fXhKTYK', type: 'youtube' },
    { id: 'yt_coincodex', title: 'Sub CoinCodex', reward: 50, link: 'https://youtube.com/@coincodex?si=afSZv7q0xW-h7b7u', type: 'youtube' },
    { id: 'yt_cryptogorilla', title: 'Sub Crypto Gorilla', reward: 50, link: 'https://youtube.com/@cryptogorilla?si=BDeFpGKKh9_f5Tt0', type: 'youtube' },
    { id: 'tk1', title: 'Follow Crypto Masun', reward: 50, link: 'https://www.tiktok.com/@cryptomasun?_r=1&_t=ZN-95g0IJeYC9e', type: 'tiktok' },
    { id: 'tk2', title: 'Follow Roccos Crypto', reward: 50, link: 'https://www.tiktok.com/@roccoscrpto?_r=1&_t=ZN-95g0HSc5gEI', type: 'tiktok' },
    { id: 'yt1', title: 'Sub Crypto Master', reward: 50, link: 'https://youtube.com/@cryptomaster7452?si=wf_FY_zvTeLfcrks', type: 'youtube' },
    { id: 'yt2', title: 'Sub Martin Millionz', reward: 50, link: 'https://youtube.com/@martinmillionz?si=Lr3eciTRtnykpXhv', type: 'youtube' },
    { id: 'yt3', title: 'Sub Jesse Eckel', reward: 50, link: 'https://youtube.com/@jesseeckel2?si=k3b47dAcbl4Isjmn', type: 'youtube' },
    { id: 'tg1', title: 'Join HRUM Fam', reward: 50, link: 'https://t.me/hrumfam', type: 'telegram' },
    { id: 'tg2', title: 'Join Time Farm', reward: 50, link: 'https://t.me/TimeFarmChannel', type: 'telegram' },
    { id: 'tg3', title: 'Join Portals Community', reward: 50, link: 'https://t.me/portals_community', type: 'telegram' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPendingTasks(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id] > 0) {
            next[id] -= 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Withdraw Modal & Game
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'convert' | 'withdraw'>('convert');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [lastWheelDate, setLastWheelDate] = useState('');
  const [lastWheelAdDate, setLastWheelAdDate] = useState('');
  const [wheelAdsWatched, setWheelAdsWatched] = useState(0);
  const [adSpinsCount, setAdSpinsCount] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // Notifications State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Language Dropdown Info
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langs = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' }
  ];

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

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

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = nextMidnightUTC.getTime() - now.getTime();
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeToReset(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    
    updateCountdown(); // Run immediately
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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

      // Handle referral securely with an atomic batch
      if (inviterId && inviterId !== tId) {
        const referralRef = doc(db, 'referrals', `${inviterId}_${tId}`);
        const referralSnap = await getDoc(referralRef);
        
        if (!referralSnap.exists()) {
           try {
             const batch = writeBatch(db);
             const inviterRef = doc(db, 'users', inviterId);
             
             // 1. Create referral doc marker
             batch.set(referralRef, {
               inviterId: inviterId,
               invitedId: tId,
               createdAt: new Date().toISOString()
             });

             // 2. Give inviter +200 XP and +1 referral count
             batch.update(inviterRef, {
               points: increment(200),
               referralsCount: increment(1),
               lastReferred: tId
             });

             // 3. Give local user +200 XP and create document if missing, or update if exists
             const localPointsBonus = 500; // New user gets 500 starting bonus from referral
             if (!userSnap.exists()) {
               batch.set(userRef, {
                 userId: tId,
                 authUid: auth.currentUser?.uid || '',
                 points: localPointsBonus,
                 tonBalance: 0,
                 referralsCount: 0,
                 invitedBy: inviterId,
                 createdAt: new Date().toISOString()
               });
             } else {
               batch.update(userRef, { points: increment(200) });
             }

             await batch.commit();

             if (WebApp.isVersionAtLeast('6.2')) {
               WebApp.showAlert(t('refWelcome') || 'Welcome via referral! You received +XP.');
             } else {
               showMessage('Referral', t('refWelcome') || 'Welcome via referral! You received +XP.');
             }
           } catch (e: any) {
             console.error("Referral batch error", e?.message || String(e));
           }
        } else if (!userSnap.exists()) {
           // Referral already existed but user didn't exist? Just create the user.
           await setDoc(userRef, {
             userId: tId,
             authUid: auth.currentUser?.uid || '',
             points: 0,
             tonBalance: 0,
             referralsCount: 0,
             invitedBy: null,
             createdAt: new Date().toISOString()
           });
        }
      } else if (!userSnap.exists()) {
        // No referral, just normal user creation
        await setDoc(userRef, {
          userId: tId,
          authUid: auth.currentUser?.uid || '',
          points: 0,
          tonBalance: 0,
          referralsCount: 0,
          invitedBy: null,
          createdAt: new Date().toISOString()
        });
      }

      // Realtime listener for this user
      return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPoints(data.points || 0);
          setTonBalance(data.tonBalance || 0);
          setReferralsCount(data.referralsCount || 0);
          
          if (data.completedTasks) setCompletedTasks(data.completedTasks);
          if (data.lastAdDate) setLastAdDate(data.lastAdDate);
          if (data.adsWatched !== undefined) setAdsWatched(data.adsWatched);
          
          if (data.lastWheelDate) setLastWheelDate(data.lastWheelDate);
          if (data.lastWheelAdDate) setLastWheelAdDate(data.lastWheelAdDate);
          if (data.wheelAdsWatched !== undefined) setWheelAdsWatched(data.wheelAdsWatched);
          if (data.adSpinsCount !== undefined) setAdSpinsCount(data.adSpinsCount);
        }
      });
    };
    
    let unsubListener: any;
    initFirebaseData().then((unsub) => { 
      unsubListener = unsub; 
      setIsLoading(false);
    }).catch((e) => {
      console.error(e);
      setIsLoading(false);
    });

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

  const pushUserData = (updates: any) => {
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', String(userId)), updates).catch(e => console.warn("Failed to push user data", e));
    }
  };

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  const WATCH_LIMIT = 3;
  const XP_REWARD_AFTER_3 = 100;
  const ADS_WATCH_ID = "int-28074";
  const ADS_WHEEL_ID = "int-28173";


  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleStartSpin = async () => {
    if (isSpinning) return;
    
    const result = await spinWheel();
    if (!result) {
      if (adSpinsCount === 0) {
        const confirmMsg = "You used your daily free spin. Want to spin again by watching an ad?";
        if (WebApp.isVersionAtLeast('6.2')) {
          WebApp.showConfirm(confirmMsg, (ok) => {
            if (ok) triggerWheelAd();
          });
        } else {
          if (window.confirm(confirmMsg)) {
            triggerWheelAd();
          }
        }
      }
      return;
    }

    setIsSpinning(true);
    // Calculate final rotation logic
    // Each segment is 360 / 8 = 45 degrees
    // We want the wheel to spin several times then land on the segment
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const segmentAngle = 45;
    const targetAngle = 360 - (result.id * segmentAngle);
    const finalRotation = (extraSpins * 360) + targetAngle;
    
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Give reward
      if (result.type === 'xp') {
        setPoints(p => p + result.value);
        if (auth.currentUser) {
          updateDoc(doc(db, 'users', String(userId)), { points: increment(result.value) }).catch(e => console.error(e));
        }
      } else {
        setTonBalance(b => b + result.value);
        if (auth.currentUser) {
          updateDoc(doc(db, 'users', String(userId)), { tonBalance: increment(result.value) }).catch(e => console.error(e));
        }
      }
      
      WebApp.HapticFeedback.notificationOccurred('success');
      showMessage("Congratulations!", `You won ${result.label}!`);
      // Reset rotation for next time or keep it
    }, 4000);
  };

  const startTask = (taskId: string, link: string) => {
    if (completedTasks.includes(taskId)) return;
    if (link.includes('t.me')) {
      WebApp.openTelegramLink(link);
    } else {
      WebApp.openLink(link);
    }
    setPendingTasks(prev => ({ ...prev, [taskId]: 7 }));
  };

  const completeTask = (taskId: string, reward: number) => {
    if (!completedTasks.includes(taskId)) {
      const newCompleted = [...completedTasks, taskId];
      setCompletedTasks(newCompleted);
      setPoints(p => p + reward);

      // Firebase Sync
      if (auth.currentUser) {
        updateDoc(doc(db, 'users', String(userId)), { 
           points: increment(reward),
           completedTasks: arrayUnion(taskId)
        }).catch(e => console.error(e?.message || String(e)));
      }

      WebApp.HapticFeedback.notificationOccurred('success');
      
      // Cleanup pending state
      setPendingTasks(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  const handleWithdraw = async () => {
    if (tonBalance >= 4 && withdrawAddress) {
      setTonBalance(p => p - 4);
      if (auth.currentUser) {
        updateDoc(doc(db, 'users', String(userId)), { tonBalance: increment(-4) }).catch(e => console.error(e?.message || String(e)));
      }
      
      // Send to Google Sheets (Mocked endpoint for demonstration)
      try {
        await fetch('https://script.google.com/macros/s/AKfycbz_YOUR_SCRIPT_ID/exec', {
           method: 'POST',
           mode: 'no-cors',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             username: String(userName),
             userId: String(userId),
             address: String(withdrawAddress),
             amount: 4,
             timestamp: new Date().toISOString()
           })
        });
      } catch (e) {
        console.error('Google Sheets sync error', e);
      }

      showMessage(
        t('withdraw') || 'Withdrawal',
        `Withdrawal request sent for address:\n${withdrawAddress}\n\nProcessing takes up to 24 hours.`
      );
      
      setIsWalletModalOpen(false);
      setWithdrawAddress('');
    } else {
      showMessage('Alert', t('withdrawMin') || 'Minimum 4 TON required.');
    }
  };

  const handleExchangeXP = () => {
    if (points >= 10000) {
      setPoints(p => p - 10000);
      setTonBalance(t => t + 1);
      if (auth.currentUser) {
        updateDoc(doc(db, 'users', String(userId)), { 
           points: increment(-10000),
           tonBalance: increment(1)
        }).catch(e => console.error(e?.message || String(e)));
      }
      WebApp.HapticFeedback.notificationOccurred('success');
      showMessage('Success', 'Successfully converted 10,000 XP to 1 TON!');
    } else {
      showMessage('Error', 'Not enough XP. 10,000 XP is required for 1 TON.');
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
        }).catch((e) => console.error('Silent fetch failed', e?.message || String(e)));

        showMessage(
          t('createAd') || 'Ad Creation',
          `Payment successful for ${cost} TON.\nYour task "${adName}" will be published in 10 hours.`
        );
        
        const newCreatedAd = {
           id: 'adv_' + Math.random().toString(36).substring(7),
           name: adName,
           createdAt: Date.now()
        };
        
        const updatedAds = [newCreatedAd, ...createdAds].map(ad => ({ id: String(ad.id), name: String(ad.name), createdAt: Number(ad.createdAt) }));
        setCreatedAds(updatedAds);
        try {
          localStorage.setItem('tonew_created_ads', JSON.stringify(updatedAds));
        } catch(e) {}

        setAdName('');
        setAdLink('');
        setAdImpressions(1200);
        
        WebApp.HapticFeedback.notificationOccurred('success');
      } catch (error: any) {
        // As requested: block annoying messages and popups if user didn't complete payment or something else happened
        console.warn("Payment interrupted or failed silently:", error?.message || String(error));
        // We removed showMessage('Payment Failed', ...) to prevent annoying popups
        try {
          WebApp.HapticFeedback.notificationOccurred('error');
        } catch(e) {}
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
  
  const calculatedUserRank = Math.max(1, 100000 - points - (completedTasks.length * 56) - (referralsCount * 120));

  return (
    <div className={`h-[100dvh] w-full max-w-[100vw] overflow-x-hidden overflow-y-hidden flex flex-col bg-slate-900 text-slate-100 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {isLoading && <AppLoadingScreen />}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOpen && (
           <AppMiniGame 
             onClose={() => setIsGameOpen(false)} 
             onEarn={(xp) => {
               setPoints(p => p + xp);
               if (auth.currentUser) {
                 updateDoc(doc(db, 'users', String(userId)), { points: increment(xp) }).catch(e => console.error(e?.message || String(e)));
               }
             }} 
           />
        )}
      </AnimatePresence>

      {/* 1. Header Area (Fixed Top) */}
      <header className="shrink-0 flex justify-between items-center px-4 py-2.5 bg-slate-800 rounded-b-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-40 relative">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 p-[2px] shadow-lg">
             <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center">
                <span className="font-extrabold text-lg text-slate-200">{userName.charAt(0).toUpperCase()}</span>
             </div>
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-sm leading-tight text-white mb-0.5 max-w-[80px] lg:max-w-[120px] truncate block">{userName}</span>
             <span className="text-[10px] text-yellow-400 font-extrabold tracking-widest uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded-md inline-block w-max">
                {t('lvlNewbie')}
             </span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse relative flex-shrink-0">
          <button 
            onClick={() => setIsNotifOpen(true)} 
            className="relative p-1.5 bg-slate-700/80 hover:bg-slate-700 rounded-full transition-colors outline-none border border-slate-600/50 shadow-sm mt-0.5"
          >
            <Bell className="w-4 h-4 text-slate-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-slate-800 animate-pulse"></span>
            )}
          </button>
          
          <div className="relative mt-0.5">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-1.5 bg-slate-700/80 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center outline-none border border-slate-600/50 shadow-sm"
            >
              <Globe className="w-4 h-4 text-slate-200" />
            </button>
            <AnimatePresence>
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    className="absolute top-full right-0 rtl:left-0 rtl:right-auto mt-2 bg-slate-800 border border-slate-600 shadow-2xl rounded-xl z-50 overflow-hidden w-32 flex flex-col origin-top-right rtl:origin-top-left"
                  >
                    {langs.map(l => (
                      <button
                        key={l.code}
                        onClick={() => {
                          changeLanguage(l.code);
                          setIsLangOpen(false);
                        }}
                        className={`flex items-center px-3 py-2 text-xs font-bold transition-colors ${i18n.language === l.code ? 'bg-cyan-900/40 text-cyan-400' : 'text-slate-300 hover:bg-slate-700'}`}
                      >
                        <span className="mr-3 rtl:ml-3 rtl:mr-0 text-base leading-none">{l.flag}</span>
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-end justify-center ml-1.5 flex-shrink-0 rtl:mr-1.5 rtl:ml-0">
             <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-900/60 px-1.5 py-[2px] rounded-full border border-slate-700/50 shadow-inner mb-0.5">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse border border-emerald-300"></span>
                <span className="text-[8px] font-bold text-emerald-400 tracking-wider font-mono uppercase leading-none mt-[1px]">{liveUsers.toLocaleString()} online</span>
             </div>
             <div className="flex items-center justify-end relative h-[22px] w-[80px]">
               <div className="absolute right-0 rtl:left-0 rtl:right-auto transform scale-[0.55] origin-right rtl:origin-left top-[-5px]">
                 <TonConnectButton />
               </div>
             </div>
          </div>

        </div>
      </header>

      {/* 2. Marquee Live Feed */}
      <div className="shrink-0 bg-slate-800/60 border-b border-slate-700/50 py-1.5 px-4 flex items-center z-30 shadow-inner">
        <div className="flex items-center flex-1 overflow-hidden">
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
                 <button onClick={() => setIsLeaderboardOpen(true)} className="flex flex-col items-end group outline-none">
                   <span className="font-bold text-cyan-400 group-active:scale-95 transition-transform flex items-center">
                     #{calculatedUserRank.toLocaleString()} <TonImage className="w-3 h-3 ml-1 rtl:mr-1 rtl:ml-0 drop-shadow-sm opacity-0 hidden" />
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
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center">
                <Play className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-pink-400" />
                {t('dailyTask')}
              </h3>
              
              {/* Lucky Wheel Entry */}
              <div 
                onClick={() => setIsWheelOpen(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50 p-4 rounded-[28px] shadow-lg flex items-center active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center flex-1 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 shadow-lg group-hover:rotate-12 transition-transform border border-indigo-400/20">
                    <Sparkles className="text-white w-7 h-7" />
                  </div>
                  <div className="flex-1 pr-2 rtl:pl-2 rtl:pr-0">
                    <p className="font-extrabold text-sm text-slate-100">{t('luckyWheel')}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight flex items-center">
                       Win up to <span className="text-emerald-400 mx-1">15 TON</span> or <span className="text-amber-400 mx-1">1000 XP</span>
                    </p>
                  </div>
                </div>
                <div className="z-10 bg-slate-700/50 p-2 rounded-xl text-slate-300 group-hover:text-white transition-colors group-hover:bg-slate-700">
                  <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </div>
              </div>

              {/* Adsgram Daily Task */}
              <div className="bg-slate-800 rounded-[24px] p-2 border-b-[4px] border-slate-900 shadow-md flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 shadow-inner">
                    <Play className="fill-white text-white w-6 h-6" />
                  </div>
                  <div className="flex-1 pr-2 rtl:pl-2 rtl:pr-0">
                    <p className="font-extrabold text-sm text-slate-100">{t('sponsorTasks')} <span className="text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded ml-1 font-mono text-pink-300">{Math.min(lastAdDate === new Date().toDateString() ? adsWatched : 0, 3)}/3</span></p>
                    <p className="text-xs font-bold text-pink-400 mt-1 bg-pink-400/10 inline-flex items-center px-2 py-0.5 rounded-md drop-shadow-sm">+100 <XpIcon className="w-4 h-4 ml-1.5" /></p>
                  </div>
                </div>
                {(lastAdDate === new Date().toDateString() && adsWatched > 3) ? (
                  <button disabled className="bg-slate-700 text-slate-300 font-extrabold py-2 px-4 rounded-xl border-b-[3px] border-slate-800 transition-all text-xs shrink-0 cursor-not-allowed flex flex-col items-center justify-center min-w-[80px]">
                    <Clock className="w-4 h-4 mb-0.5 opacity-60" />
                    <span className="font-mono tracking-wider opacity-80">{timeToReset}</span>
                  </button>
                ) : (lastAdDate === new Date().toDateString() && adsWatched === 3) ? (
                  <button onClick={claimAdReward} className="bg-emerald-500 text-white font-extrabold py-2.5 px-6 rounded-xl border-b-[3px] border-emerald-700 active:border-b-0 active:translate-y-[3px] transition-all text-sm shrink-0">
                    {t('claim')}
                  </button>
                ) : (
                  <button onClick={triggerAd} disabled={isAdLoading} className="bg-pink-500 text-white font-extrabold py-2.5 px-5 rounded-xl border-b-[3px] border-pink-700 active:border-b-0 active:translate-y-[3px] transition-all text-sm shrink-0 disabled:opacity-80 flex items-center justify-center min-w-[80px]">
                    {isAdLoading ? <Loader2 className="w-4 h-4 animate-spin my-0.5 mx-2" /> : t('watch')}
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
                {adTasks.map((task: any, idx) => {
                  const isDone = completedTasks.includes(task.id);
                  const waitTime = pendingTasks[task.id];
                  const canClaim = waitTime !== undefined && waitTime <= 0;
                  const isPending = waitTime !== undefined && waitTime > 0;

                  const getIconColor = (type?: string) => {
                    if (type === 'instagram') return 'bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500';
                    if (type === 'youtube') return 'bg-red-600';
                    if (type === 'tiktok') return 'bg-slate-900 border border-slate-700';
                    if (type === 'telegram') return 'bg-sky-500';
                    return 'bg-gradient-to-br from-blue-500 to-cyan-500';
                  };

                  return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-slate-800 rounded-[24px] p-2 border-b-[4px] border-slate-900 shadow-md flex items-center justify-between ${isDone ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center flex-1 overflow-hidden">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0 shadow-inner shrink-0 ${isDone ? 'bg-slate-700' : getIconColor(task.type)}`}>
                          {isDone ? <Check className="text-emerald-400 w-5 h-5" /> : <SocialIcon type={task.type} className="text-white w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
                          <p className={`font-extrabold text-sm truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{task.title}</p>
                          <p className={`text-xs font-bold mt-1 inline-flex items-center px-2 py-0.5 rounded-md drop-shadow-sm ${isDone ? 'text-slate-500 bg-slate-700/50' : 'text-cyan-400 bg-cyan-400/10'}`}>
                            +{task.reward} <XpIcon className="w-4 h-4 ml-1.5" />
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (isDone) return;
                          if (canClaim) {
                            completeTask(task.id, task.reward);
                          } else if (!isPending) {
                            startTask(task.id, task.link);
                          }
                        }}
                        disabled={isDone || isPending}
                        className={`font-extrabold rounded-xl border-b-[3px] transition-all text-sm shrink-0 px-5 py-2.5 min-w-[85px] text-center ${
                          isDone 
                          ? 'bg-slate-700 text-slate-500 border-slate-800 cursor-not-allowed' 
                          : isPending
                          ? 'bg-slate-800 text-slate-400 border-slate-900 cursor-not-allowed border-b-[1px]'
                          : canClaim
                          ? 'bg-emerald-500 text-white border-emerald-700 animate-pulse active:border-b-0 active:translate-y-[3px]'
                          : 'bg-cyan-500 text-white border-cyan-700 active:border-b-0 active:translate-y-[3px]'
                        }`}
                      >
                        {isDone ? t('taskDone') : isPending ? `${waitTime}s` : canClaim ? t('claim') : t('watch')}
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
          
          <button onClick={() => setActiveTab('home')} className="flex flex-col items-center justify-end w-16 relative group outline-none">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'home' ? 'bg-cyan-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-cyan-300'}`}>
              <Home className={`w-6 h-6 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'home' ? 'text-cyan-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navHome')}</span>
          </button>

          <button onClick={() => setActiveTab('tasks')} className="flex flex-col items-center justify-end w-16 relative group outline-none">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'tasks' ? 'bg-pink-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-pink-300'}`}>
              <Coins className={`w-6 h-6 transition-transform ${activeTab === 'tasks' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'tasks' ? 'text-pink-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navEarn')}</span>
          </button>

          <button onClick={() => setActiveTab('ads')} className="flex flex-col items-center justify-end w-16 relative group outline-none">
            <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === 'ads' ? 'bg-purple-500 text-white p-3 mb-1 shadow-lg translate-y-[-10px]' : 'text-slate-400 p-2 group-hover:text-purple-300'}`}>
              <PlusCircle className={`w-6 h-6 transition-transform ${activeTab === 'ads' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-extrabold tracking-wide transition-colors ${activeTab === 'ads' ? 'text-purple-400 delay-100 opacity-100 absolute bottom-[-16px]' : 'text-slate-500 mt-1'}`}>{t('navPromote')}</span>
          </button>

          <button onClick={() => setActiveTab('invite')} className="flex flex-col items-center justify-end w-16 relative group outline-none">
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-[30px] w-full max-w-[340px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>

              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700 p-1.5 rounded-full transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-400 rounded-[22px] flex items-center justify-center mx-auto mb-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)] transform rotate-2 hover:rotate-0 transition-transform duration-300 border border-white/20">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-1">{t('internalWallet')}</h3>
                <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse bg-slate-950/40 rounded-2xl py-2 px-4 shadow-inner border border-white/5 backdrop-blur-md">
                  <div className="flex flex-col items-center">
                    <span className="text-amber-400 text-base font-black leading-none">{points.toLocaleString()}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter mt-1">XP Points</span>
                  </div>
                  <div className="w-px h-5 bg-slate-800"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 text-base font-black leading-none flex items-center">{tonBalance} <TonImage className="w-3.5 h-3.5 ml-1" /></span>
                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter mt-1">TON Coins</span>
                  </div>
                </div>
              </div>

              {/* TABS */}
              <div className="flex bg-slate-950/40 p-1 rounded-xl mb-6 border border-white/5 relative z-10">
                <button 
                  onClick={() => setWalletTab('convert')}
                  className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all duration-200 ${walletTab === 'convert' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                   {t('convert')}
                </button>
                <button 
                  onClick={() => setWalletTab('withdraw')}
                  className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all duration-200 ${walletTab === 'withdraw' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t('withdraw')}
                </button>
              </div>

              {walletTab === 'convert' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-4 relative z-10">
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/5 rounded-2xl p-4 relative group overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                      <div className="text-center flex-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 block">Exchange</span>
                        <div className="bg-amber-500/10 text-amber-500 rounded-lg py-1.5 px-2.5 inline-block border border-amber-500/20 font-mono font-bold text-xs">
                          10k XP
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-700/50 rounded-full">
                        <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-center flex-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 block">Receive</span>
                        <div className="flex items-center justify-center">
                          <div className="bg-emerald-500/10 text-emerald-500 rounded-lg py-1.5 px-2.5 border border-emerald-500/20 font-mono font-bold text-xs flex items-center">
                            1 <TonImage className="w-3.5 h-3.5 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleExchangeXP}
                    disabled={points < 10000}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:grayscale disabled:opacity-50 ${points >= 10000 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-orange-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    {t('convert')} Now
                  </button>
                  <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest bg-slate-900/30 py-1.5 rounded-lg border border-white/5">
                    ⚡️ Instant Balance Transformation
                  </p>
                </motion.div>
              )}

              {walletTab === 'withdraw' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-4 relative z-10">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl py-3 px-4 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wide">
                      Withdrawal Secure • {t('withdrawMin')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Recipient address</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        placeholder="Ex: UQCT...N1Ad3"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleWithdraw}
                    disabled={tonBalance < 4 || !withdrawAddress}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:grayscale disabled:opacity-50 ${tonBalance >= 4 && withdrawAddress ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    Confirm Withdrawal
                  </button>
                  <div className="flex items-center justify-center space-x-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest pt-2">
                    <Clock className="w-3 h-3" />
                    <span>Processing: 24h MAX</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Message Modal / Popup Replacement */}
      <AnimatePresence>
        {appModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 w-full max-w-[100vw] overflow-hidden" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border-2 border-slate-700/50 p-6 rounded-[28px] shadow-2xl max-w-sm w-full relative overflow-x-hidden"
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

      {/* Notifications / Messages Desktop Panel */}
      <AnimatePresence>
        {isNotifOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-slate-900 flex flex-col w-full max-w-[100vw] overflow-x-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-800 bg-slate-900 z-10 shrink-0">
              <h2 className="text-xl font-black text-white flex items-center">
                <Folder className="w-6 h-6 mr-3 text-cyan-400" /> System Files
              </h2>
              <button onClick={() => setIsNotifOpen(false)} className="p-2 bg-slate-800/80 rounded-full text-slate-300 hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No system files found.</div>
              ) : (
                notifications.map(notif => (
                  <motion.button
                    key={notif.id}
                    onClick={() => {
                      setSelectedNotif(notif);
                      markAsRead(notif.id);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-start text-left p-4 rounded-[20px] border-[2px] transition-all bg-slate-800/50 hover:bg-slate-800 shadow-md ${!notif.isRead ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-slate-700/50'}`}
                  >
                    <div className={`p-3 rounded-2xl mr-4 shrink-0 shadow-inner ${!notif.isRead ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {notif.iconType === 'update' && <FileText className="w-5 h-5" />}
                      {notif.iconType === 'event' && <FileText className="w-5 h-5" />}
                      {notif.iconType === 'alert' && <FileText className="w-5 h-5" />}
                      {notif.iconType === 'gift' && <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 pt-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                         <h4 className={`font-extrabold text-sm truncate pr-2 ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                           {notif.title}
                         </h4>
                         {!notif.isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>}
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate mb-2">{notif.content}</p>
                      <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{notif.date}</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Wheel Modal */}
      <AnimatePresence>
        {isWheelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-slate-700/50 rounded-[40px] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden flex flex-col items-center"
            >
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>

              <button 
                onClick={() => setIsWheelOpen(false)}
                className="absolute top-5 right-5 rtl:left-5 rtl:right-auto text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 z-10 w-full pt-4 flex flex-col items-center">
                <h3 className="text-2xl font-black text-white mb-1 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 mr-3 text-purple-400" /> {t('luckyWheel')}
                </h3>
                <div className="bg-slate-800/60 rounded-xl py-2 px-4 shadow-inner border border-slate-700/50 flex flex-col items-center justify-center min-w-[200px]">
                  <div className="flex items-center text-xs font-black uppercase tracking-wider text-slate-200">
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 text-cyan-400 ${isSpinning ? 'animate-spin' : ''}`} />
                    {lastWheelDate !== new Date().toDateString() ? (
                      <span className="text-emerald-400">{t('freeSpin') || 'Free Spin'}</span>
                    ) : (
                      <span className="text-slate-400">{t('adSpin') || 'Ad Spin'} ({adSpinsCount})</span>
                    )}
                  </div>
                  
                  {lastWheelDate === new Date().toDateString() && (
                    <div className="flex items-center mt-2 text-[10px] font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20 w-fit shrink-0">
                      <Clock className="w-3 h-3 mr-1.5" /> Next free in: <span className="font-mono ml-1">{timeToReset}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* The Wheel Visual */}
              <div className="relative w-64 h-64 mb-8 flex items-center justify-center shrink-0">
                {/* Pointer */}
                <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
                  <div className="w-4 h-6 bg-white rounded-b-full shadow-lg border-x-2 border-slate-900 z-10"></div>
                  <div className="absolute top-0 w-6 h-6 bg-indigo-500 rounded-full blur-md opacity-50"></div>
                </div>

                {/* Spinning part */}
                <motion.div 
                  className="w-full h-full rounded-full border-[6px] border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden bg-slate-800"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
                  style={{ transformOrigin: 'center' }}
                >
                  <div className="absolute inset-0 rounded-full border-[10px] border-slate-900/50 z-10 pointer-events-none"></div>
                  
                  {/* Slices using SVG for better control */}
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-22.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                      const colors = [
                        '#818cf8', '#f472b6', '#34d399', '#fbbf24', 
                        '#a78bfa', '#ec4899', '#2dd4bf', '#f59e0b'
                      ];
                      const labels = ['5 XP', '10 XP', '15 XP', '0.005 T', '50 XP', '1k XP', '1 TON', '15 T'];
                      const angle = i * 45;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 50 + 50 * Math.cos(rad);
                      const y1 = 50 + 50 * Math.sin(rad);
                      const nextRad = ((angle + 45) * Math.PI) / 180;
                      const x2 = 50 + 50 * Math.cos(nextRad);
                      const y2 = 50 + 50 * Math.sin(nextRad);
                      
                      return (
                        <g key={i}>
                          <path 
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={colors[i]}
                            className="opacity-90 active:opacity-100 transition-opacity stroke-slate-900 stroke-[0.5]"
                          />
                          <text 
                            x="50" 
                            y="20" 
                            transform={`rotate(${angle + 22.5}, 50, 50)`}
                            textAnchor="middle" 
                            fill="white" 
                            className="text-[5px] font-black pointer-events-none drop-shadow-md"
                          >
                            {labels[i]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-slate-900 rounded-full z-10 border-4 border-slate-800 flex items-center justify-center shadow-lg">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse"></div>
                </div>
              </div>

              <div className="w-full space-y-4 z-10">
                <button 
                  onClick={handleStartSpin}
                  disabled={isSpinning || (lastWheelDate === new Date().toDateString() && adSpinsCount === 0)}
                  className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:grayscale disabled:opacity-50 ${!isSpinning && (lastWheelDate !== new Date().toDateString() || adSpinsCount > 0) ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isSpinning ? 'Good Luck!' : (lastWheelDate !== new Date().toDateString() ? t('freeSpin') : t('spin'))}
                </button>

                {lastWheelDate === new Date().toDateString() && (lastWheelAdDate === new Date().toDateString() ? wheelAdsWatched : 0) < 3 && !isSpinning && (
                  <button 
                    onClick={triggerWheelAd}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-700/50 transition-all flex items-center justify-center"
                  >
                    <Megaphone className="w-4 h-4 mr-2" /> Get +1 Ad Spin ({lastWheelAdDate === new Date().toDateString() ? wheelAdsWatched : 0}/3)
                  </button>
                )}
                {lastWheelDate === new Date().toDateString() && (lastWheelAdDate === new Date().toDateString() ? wheelAdsWatched : 0) >= 3 && adSpinsCount === 0 && !isSpinning && (
                  <button disabled className="w-full py-3 bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-700/50 transition-all flex items-center justify-center cursor-not-allowed">
                    <Clock className="w-4 h-4 mr-2 opacity-60" /> Next ad spin in: {timeToReset}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Notification Bottom Sheet */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="fixed inset-0 z-[120] flex flex-col justify-end w-full max-w-[100vw] overflow-x-hidden"
          >
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedNotif(null)} />
            <div className="bg-slate-800 rounded-t-[36px] p-6 pb-10 shadow-2xl relative border-t-[3px] border-slate-700 w-full max-h-[80vh] flex flex-col">
              <div className="w-14 h-1.5 bg-slate-600 rounded-full mx-auto mb-6 opacity-80" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                   <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mr-4 border border-indigo-500/30">
                     {selectedNotif.iconType === 'update' && <Megaphone className="w-6 h-6" />}
                     {selectedNotif.iconType === 'event' && <Gamepad2 className="w-6 h-6" />}
                     {selectedNotif.iconType === 'alert' && <ShieldCheck className="w-6 h-6 text-red-400" />}
                     {selectedNotif.iconType === 'gift' && <Gift className="w-6 h-6" />}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-white leading-tight">{selectedNotif.title}</h3>
                     <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase mt-1 inline-block">{selectedNotif.date}</span>
                   </div>
                </div>
                <button onClick={() => setSelectedNotif(null)} className="p-2 bg-slate-700/50 rounded-full text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto mb-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full pr-2">
                 <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-line">
                   {selectedNotif.content}
                 </p>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="w-full bg-cyan-600 text-white font-extrabold py-4 rounded-2xl border-b-[4px] border-cyan-800 shadow-xl active:border-b-0 active:translate-y-[4px] transition-all text-sm mb-2"
              >
                Superb, understood!
              </button>
            </div>
          </motion.div>
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
            className="fixed inset-0 z-50 flex flex-col justify-end w-full max-w-[100vw] overflow-x-hidden"
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
                {[
                  { name: MOCK_NAMES[0], score: 4520000 },
                  { name: MOCK_NAMES[1], score: 3890000 },
                  { name: MOCK_NAMES[2], score: 3254000 },
                ].map((user, idx) => (
                  <div key={user.name + idx} className="flex items-center justify-between p-3 rounded-2xl border-l-[4px] bg-slate-900/50 border-slate-700">
                     <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 rtl:ml-3 rtl:mr-0 ${idx === 0 ? 'bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700 text-white'}`}>
                           #{idx + 1}
                        </div>
                        <span className="font-bold text-sm text-slate-300">
                           {user.name}
                        </span>
                     </div>
                     <span className="font-mono font-bold text-amber-400 text-sm">
                        {user.score.toLocaleString()} XP
                     </span>
                  </div>
                ))}

                {calculatedUserRank > 3 && (
                  <div className="flex justify-center items-center py-2">
                     <span className="text-slate-600 text-xl tracking-[0.2em] leading-none">•••</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-2xl border-l-[4px] bg-indigo-900/40 border-indigo-500 shadow-md">
                   <div className="flex items-center">
                      <div className="min-w-[2rem] h-8 px-2 rounded-full flex items-center justify-center font-bold text-sm mr-3 rtl:ml-3 rtl:mr-0 bg-slate-800/80 text-slate-300 border border-slate-600/50">
                         #{calculatedUserRank.toLocaleString()}
                      </div>
                      <span className="font-bold text-sm text-indigo-300">
                         {userName} (You)
                      </span>
                   </div>
                   <span className="font-mono font-bold text-amber-400 text-sm">
                      {points.toLocaleString()} XP
                   </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
