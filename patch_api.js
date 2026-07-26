import fs from 'fs';
let code = fs.readFileSync('src/services/api.ts', 'utf8');
code = code.replace(
  'export const GameService = {',
  `let CURRENT_SEASON = 2;
export const getCollectionName = (base: string) => {
  return CURRENT_SEASON === 1 ? base : \`\${base}_s\${CURRENT_SEASON}\`;
};

export const GameService = {
  setSeason(season: number) {
    CURRENT_SEASON = season;
  },`
);
fs.writeFileSync('src/services/api.ts', code);
