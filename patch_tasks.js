import fs from 'fs';
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const s1Tasks = `const INITIAL_TASKS = [
  { id: 't1', title: 'Follow Telegram Channel', reward: 50000, link: 'https://t.me/sekanedr', icon: '💎', category: 'social' },
  { id: 't2', title: 'Join Community Group', reward: 50000, link: 'https://t.me/sekanedrchat', icon: '🚀', category: 'social' },
  { id: 't3', title: 'Follow X (Twitter)', reward: 50000, link: 'https://twitter.com/PlushTap', icon: '🐦', category: 'social' },
  { id: 't4', title: 'Subscribe to YouTube', reward: 50000, link: 'https://youtube.com/@PlushTap', icon: '📺', category: 'social' },
  { id: 't5', title: 'Play 3 Days in a row', reward: 100000, type: 'daily', icon: '🔥', category: 'daily' },
  { id: 't6', title: 'Invite 5 Friends', reward: 250000, type: 'referral', icon: '👥', category: 'referral' },
];`;

const s2Tasks = `
const TASKS_S1 = [
  { id: 't1', title: 'Follow Telegram Channel', reward: 50000, link: 'https://t.me/sekanedr', icon: '💎', category: 'social' },
  { id: 't2', title: 'Join Community Group', reward: 50000, link: 'https://t.me/sekanedrchat', icon: '🚀', category: 'social' },
  { id: 't3', title: 'Follow X (Twitter)', reward: 50000, link: 'https://twitter.com/PlushTap', icon: '🐦', category: 'social' },
];

const TASKS_S2 = [
  { id: 's2_1', title: 'Retweet Season 2 Launch', reward: 100000, link: 'https://twitter.com/PlushTap', icon: '🐦', category: 'social' },
  { id: 's2_2', title: 'Reach Platinum League in S2', reward: 500000, type: 'league', icon: '🏆', category: 'seasonal' },
  { id: 's2_3', title: 'Tap 10,000 times today', reward: 50000, type: 'daily', icon: '👆', category: 'daily' },
  { id: 's2_4', title: 'Invite 3 Active Friends this week', reward: 300000, type: 'weekly', icon: '👥', category: 'weekly' },
  { id: 's2_5', title: 'Connect TON Wallet', reward: 200000, type: 'wallet', icon: '💎', category: 'social' },
];`;

code = code.replace(/const INITIAL_TASKS = \[\s*[\s\S]*?\];/, s2Tasks);

const replaceUsage = `const INITIAL_TASKS = currentSeason === 2 ? TASKS_S2 : TASKS_S1;`;
code = code.replace('const [activeTab, setActiveTab] = useState', `const INITIAL_TASKS = currentSeason === 2 ? TASKS_S2 : TASKS_S1;\n  const [activeTab, setActiveTab] = useState`);

// also inject currentSeason if it's missing in destructuring
if (!code.includes('currentSeason } = useGameStore()')) {
  code = code.replace('const { missions, completeMission, balance, addBalance, sync } = useGameStore();', 'const { missions, completeMission, balance, addBalance, sync, currentSeason } = useGameStore();');
}

fs.writeFileSync('src/pages/Tasks.tsx', code);
