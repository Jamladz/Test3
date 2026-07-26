import fs from 'fs';
let code = fs.readFileSync('src/pages/Game.tsx', 'utf8');
code = code.replace(
  'src="https://i.suar.me/Pp1p0/l"',
  'src={currentSeason === 2 ? "https://i.suar.me/ZjjZO/l" : "https://i.suar.me/Pp1p0/l"}\n               style={currentSeason === 2 ? { filter: "hue-rotate(180deg) drop-shadow(0 0 25px rgba(0,243,255,0.4))" } : {}}'
);
fs.writeFileSync('src/pages/Game.tsx', code);
