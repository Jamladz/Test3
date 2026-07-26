import fs from 'fs';
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

const importReplacement = `import { useGameStore } from '../store/useGameStore';
import { useTranslation } from '../lib/i18n';
import { Globe } from 'lucide-react';`;
code = code.replace("import { useGameStore } from '../store/useGameStore';", importReplacement);

const hooksReplacement = `const { username, balance, profitPerHour, withdrawals, role, season1Stats, language, setLanguage } = useGameStore();
  const t = useTranslation(language);`;
code = code.replace(/const \{ username, balance, profitPerHour, withdrawals, role, season1Stats \} = useGameStore\(\);/, hooksReplacement);

const langSelector = `
        <div className="mt-4 flex flex-col gap-2">
           <h4 className="text-white/70 font-bold text-xs uppercase tracking-widest text-left flex items-center gap-2">
             <Globe size={14} /> {t('language')}
           </h4>
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
             {['en', 'ar', 'ru'].map(lang => (
               <button 
                 key={lang}
                 onClick={() => setLanguage(lang)}
                 className={\`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors uppercase \${language === lang ? 'bg-[#00f3ff]/20 text-[#00f3ff]' : 'text-white/40 hover:text-white/80'}\`}
               >
                 {lang}
               </button>
             ))}
           </div>
        </div>
`;

code = code.replace('{withdrawals && withdrawals', langSelector + '\n        {withdrawals && withdrawals');

fs.writeFileSync('src/components/ProfileModal.tsx', code);
