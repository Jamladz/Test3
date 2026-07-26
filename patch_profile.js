import fs from 'fs';
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

const searchStr = `{season1Stats && (
           <div className="mt-4 mb-6 space-y-2">
              <h4 className="text-white/70 font-bold text-xs uppercase tracking-widest text-left mb-2 flex items-center gap-2">
                Season 1 Legacy
              </h4>
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center">
                    <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Coins</span>
                    <span className="text-white font-bold text-sm">{formatCurrency(season1Stats.balance || 0)}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center">
                    <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">PPH</span>
                    <span className="text-white font-bold text-sm">{formatCurrency(season1Stats.profitPerHour || 0)}</span>
                 </div>
              </div>
           </div>
        )}`;

code = code.replace(searchStr, '<SeasonSelector />');

// also import it at the top
code = code.replace(
  "import { useTonConnectUI } from '@tonconnect/ui-react';",
  "import { useTonConnectUI } from '@tonconnect/ui-react';\nimport { SeasonSelector } from './SeasonSelector';"
);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
