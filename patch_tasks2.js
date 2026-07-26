import fs from 'fs';
let code = fs.readFileSync('src/pages/Tasks.tsx', 'utf8');

code = code.replace(
  'export function Tasks() {',
  `export function Tasks() {
  const { currentSeason } = useGameStore();
  const INITIAL_TASKS = currentSeason === 2 ? TASKS_S2 : TASKS_S1;`
);

fs.writeFileSync('src/pages/Tasks.tsx', code);
