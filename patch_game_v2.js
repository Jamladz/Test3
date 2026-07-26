import fs from 'fs';
let code = fs.readFileSync('src/pages/Game.tsx', 'utf8');

// I will just replace the background image and the tap avatar.
code = code.replace(
  `backgroundImage: 'url("https://i.suar.me/3zzxd/l")',`,
  `backgroundImage: currentSeason === 2 ? 'url("https://i.suar.me/211Qo/l")' : 'url("https://i.suar.me/3zzxd/l")',`
);

code = code.replace(
  `src={currentSeason === 2 ? "https://i.suar.me/ZjjZO/l" : "https://i.suar.me/Pp1p0/l"}`,
  `src={currentSeason === 2 ? "https://i.suar.me/WyyjA/l" : "https://i.suar.me/Pp1p0/l"}`
);

fs.writeFileSync('src/pages/Game.tsx', code);
