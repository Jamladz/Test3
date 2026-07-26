import fs from 'fs';
let code = fs.readFileSync('src/store/useGameStore.ts', 'utf8');

if (!code.includes('language: string;')) {
  code = code.replace(
    'currentSeason: number;',
    'currentSeason: number;\n  language: string;\n  setLanguage: (lang: string) => void;'
  );
  
  code = code.replace(
    'currentSeason: 2,',
    "currentSeason: 2,\n  language: 'en',\n  setLanguage: (lang) => set({ language: lang }),"
  );
  
  fs.writeFileSync('src/store/useGameStore.ts', code);
}
