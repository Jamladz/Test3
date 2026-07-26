import fs from 'fs';
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const importReplacement = `import { Users, Coins, Activity, ShieldAlert, BarChart3, TrendingUp, Settings2, Zap, ArrowUpRight, Flame, Globe, CreditCard, LayoutDashboard, Megaphone, Database } from 'lucide-react';
import { AdminSeasons } from '../components/AdminSeasons';`;
code = code.replace("import { Users, Coins, Activity, ShieldAlert, BarChart3, TrendingUp, Settings2, Zap, ArrowUpRight, Flame, Globe, CreditCard, LayoutDashboard, Megaphone } from 'lucide-react';", importReplacement);

const activeTabReplacement = `const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'withdrawals' | 'goals' | 'broadcast' | 'seasons'>('dashboard');`;
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'dashboard' \| 'players' \| 'withdrawals' \| 'goals' \| 'broadcast'>\('dashboard'\);/, activeTabReplacement);

const tabButtonReplacement = `<button 
          onClick={() => setActiveTab('broadcast')}
          className={\`pb-3 px-1 border-b-2 font-bold text-sm whitespace-nowrap transition-colors \${activeTab === 'broadcast' ? 'border-[#00f3ff] text-[#00f3ff]' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          <Megaphone size={16} className="inline mr-1" /> Broadcast
        </button>
        <button 
          onClick={() => setActiveTab('seasons')}
          className={\`pb-3 px-1 border-b-2 font-bold text-sm whitespace-nowrap transition-colors \${activeTab === 'seasons' ? 'border-[#ffaa00] text-[#ffaa00]' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          <Database size={16} className="inline mr-1" /> Seasons
        </button>`;
code = code.replace(/<button \s*onClick=\{\(\) => setActiveTab\('broadcast'\)\}[\s\S]*?<\/button>/, tabButtonReplacement);

const contentReplacement = `{activeTab === 'broadcast' && (
          <div className="bg-[#1c1c1e] rounded-2xl p-5 border border-white/5 shadow-xl">`;
code = code.replace(/\{activeTab === 'broadcast' && \(\s*<div className="bg-\[\#1c1c1e\] rounded-2xl p-5 border border-white\/5 shadow-xl">/, `{activeTab === 'seasons' && <AdminSeasons />}\n        ` + contentReplacement);

fs.writeFileSync('src/pages/Admin.tsx', code);
