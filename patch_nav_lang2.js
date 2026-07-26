import fs from 'fs';
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(
    "import { cn } from '../lib/utils';",
    "import { cn } from '../lib/utils';\nimport { useGameStore } from '../store/useGameStore';\nimport { useTranslation } from '../lib/i18n';"
  );
}

if (!code.includes('const t = useTranslation')) {
  code = code.replace(
    "export function Navigation({ currentTab, setTab, isAdmin }: NavigationProps) {",
    "export function Navigation({ currentTab, setTab, isAdmin }: NavigationProps) {\n  const { language } = useGameStore();\n  const t = useTranslation(language);"
  );
}

code = code.replace("label: 'Exchange'", "label: t('game')");
code = code.replace("label: 'Earn'", "label: t('tasks')");

fs.writeFileSync('src/components/Navigation.tsx', code);
