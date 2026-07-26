import fs from 'fs';
let code = fs.readFileSync('src/pages/Game.tsx', 'utf8');

code = code.replace(
  `{currentSeason === 2 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-[#00f3ff]/20 to-[#ffaa00]/20 border border-white/20 rounded-full px-3 py-1 flex items-center gap-1 z-20">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Season 2</span>
        </div>
      )}`,
  ``
);

fs.writeFileSync('src/pages/Game.tsx', code);
