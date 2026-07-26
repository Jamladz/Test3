import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'GameService.setSeason(config.currentSeason);',
  'GameService.setSeason(config.currentSeason);\n        useGameStore.setState({ currentSeason: config.currentSeason });'
);

fs.writeFileSync('src/App.tsx', code);
