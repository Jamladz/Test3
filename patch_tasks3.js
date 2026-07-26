import fs from 'fs';
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

const s2Tasks = `
const TASKS_S1 = [
  { id: '1', title: 'Play Portals Mini-Game', reward: 20000, icon: Send, color: 'text-[#0088cc]', url: 'https://t.me/portals/market?startapp=29ptrq' },
  { id: '2', title: 'Play Gamee App', reward: 20000, icon: Send, color: 'text-[#0088cc]', url: 'https://t.me/gamee?start=ref_1234' },
];

const TASKS_S2 = [
  { id: 's2_1', title: 'Retweet Season 2 Launch', reward: 100000, icon: Twitter, color: 'text-[#1DA1F2]', url: 'https://twitter.com/PlushTap' },
  { id: 's2_2', title: 'Reach Platinum League in S2', reward: 500000, icon: CheckCircle2, color: 'text-[#00f3ff]', url: '' },
  { id: 's2_3', title: 'Connect TON Wallet', reward: 200000, icon: Coins, color: 'text-[#FFD700]', url: '' },
];
`;

code = code.replace(/const TASKS = \[\s*[\s\S]*?\];/, s2Tasks);

if (!code.includes('const activeTasks = currentSeason === 2 ? TASKS_S2 : TASKS_S1;')) {
  code = code.replace(
    'export function Tasks() {\n  const { currentSeason } = useGameStore();\n  const INITIAL_TASKS = currentSeason === 2 ? TASKS_S2 : TASKS_S1;',
    'export function Tasks() {\n  const { currentSeason } = useGameStore();\n  const activeTasks = currentSeason === 2 ? TASKS_S2 : TASKS_S1;'
  );
  code = code.replace(/TASKS\.map/g, 'activeTasks.map');
}

fs.writeFileSync('src/pages/Tasks.tsx', code);
