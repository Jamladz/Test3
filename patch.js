import fs from 'fs';
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

code = code.replace(
  'const { username, balance, adsWatched, totalSpins, friendsCount, requestWithdrawal, withdrawals } = useGameStore();',
  'const { username, balance, adsWatched, totalSpins, friendsCount, requestWithdrawal, withdrawals, currentSeason, season1Stats } = useGameStore();'
);

code = code.replace(
  '<span className="text-xs text-[#00f3ff] uppercase tracking-widest font-bold">PlushTap Player</span>',
  '<span className="text-xs text-[#00f3ff] uppercase tracking-widest font-bold">PlushTap Player • S{currentSeason || 1}</span>'
);

code = code.replace(
  '{withdrawals && withdrawals.filter(w => w.token === \'PLUSH\').length > 0 && (',
  `{season1Stats && (
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
        )}

        {withdrawals && withdrawals.filter(w => w.token === 'PLUSH').length > 0 && (`
);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
