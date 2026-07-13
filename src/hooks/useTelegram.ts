import { useState, useEffect } from 'react';

export function useTelegramAutoLogin() {
  const [user, setUser] = useState<{ id: number; username: string; first_name: string; start_param?: string; initData?: string } | null>(null);

  useEffect(() => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa) {
      try {
        twa.ready();
        twa.expand();
        
        // Set to modern dark theme if applicable
        if (twa.setHeaderColor) twa.setHeaderColor('#000000');
        if (twa.setBackgroundColor) twa.setBackgroundColor('#000000');
      } catch (e) {
        console.warn('TWA initialization warning:', e);
      }

      let start_param = 
        twa.initDataUnsafe?.start_param || 
        new URLSearchParams(window.location.search).get('tgWebAppStartParam') || 
        new URLSearchParams(window.location.search).get('startapp') || 
        undefined;

      if (!start_param && window.location.hash) {
         // Fallbacks for hashed urls often used by Telegram Mini Apps
         const hashParams = new URLSearchParams(window.location.hash.slice(1));
         start_param = hashParams.get('tgWebAppStartParam') || hashParams.get('startapp') || hashParams.get('start_param') || undefined;
      }

      if (twa.initDataUnsafe?.user) {
        setUser({
          ...twa.initDataUnsafe.user,
          start_param,
          initData: twa.initData // Important for server-side verification
        });
      } else {
        // Mock user for local dev
        setUser({ 
           id: 12345, 
           username: 'test_user', 
           first_name: 'Test', 
           start_param,
           initData: 'query_id=mock&user=%7B%22id%22%3A12345%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22test_user%22%7D&hash=mock' 
        });
      }
    } else {
      // Mock user for local dev outside Telegram
      setUser({ id: 12345, username: 'sekanedr_is', first_name: 'Admin', initData: 'mock' });
    }
  }, []);

  return user;
}
