import fs from 'fs';
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

code = code.replace(
  "import { useGameStore } from '../store/useGameStore';",
  "import { useGameStore } from '../store/useGameStore';\nimport { useTranslation } from '../lib/i18n';"
);

code = code.replace(
  "const { role } = useGameStore();",
  "const { role, language } = useGameStore();\n  const t = useTranslation(language);"
);

code = code.replace("label: 'Game'", "label: t('game')");
code = code.replace("label: 'Mine'", "label: t('mine')");
code = code.replace("label: 'Tasks'", "label: t('tasks')");
code = code.replace("label: 'Friends'", "label: t('friends')");
code = code.replace("label: 'Admin'", "label: t('admin')");

fs.writeFileSync('src/components/Navigation.tsx', code);
