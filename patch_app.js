import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importReplacement = `import { AdSequenceOverlay } from './components/AdSequenceOverlay';
import { ConfigService } from './services/config';
import { GameService } from './services/api';`;

code = code.replace("import { AdSequenceOverlay } from './components/AdSequenceOverlay';", importReplacement);

const fetchReplacement = `useEffect(() => {
    if (user) {
      const loadGame = async () => {
        const config = await ConfigService.getSystemConfig();
        GameService.setSeason(config.currentSeason);
        
        await fetchUser(user.id.toString(), user.username, user.first_name, user.start_param, user.initData);
        setTimeout(() => {
            setIsLoading(false);
        }, 1500); // give the loading bar a moment
      };
      loadGame();
    }
  }, [user, fetchUser]);`;

code = code.replace(/useEffect\(\(\) => \{\s*if \(user\) \{\s*const loadGame = async \(\) => \{[\s\S]*?\}, \[user, fetchUser\]\);/, fetchReplacement);

fs.writeFileSync('src/App.tsx', code);
