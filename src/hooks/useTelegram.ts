import { useState, useEffect } from 'react';

export function useTelegramAutoLogin() {
  const [user, setUser] = useState<{ id: number; username: string; first_name: string; start_param?: string } | null>(null);

  useEffect(() => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa) {
      twa.ready();
      twa.expand();
      
      // Set to modern dark theme if applicable
      twa.setHeaderColor('#000000');
      twa.setBackgroundColor('#000000');

      let start_param = twa.initDataUnsafe?.start_param;
      
      // Fallbacks for start_param if it is not present in initDataUnsafe
      if (!start_param) {
         const searchParams = new URLSearchParams(window.location.search);
         const hashParams = new URLSearchParams(window.location.hash.slice(1)); // Some TWA params get passed in hash
         
         start_param = searchParams.get('start_param') || 
                       searchParams.get('tgWebAppStartParam') || 
                       searchParams.get('startapp') ||
                       hashParams.get('start_param') ||
                       hashParams.get('tgWebAppStartParam') ||
                       hashParams.get('startapp') ||
                       undefined;
      }

      if (twa.initDataUnsafe?.user) {
        setUser({
          ...twa.initDataUnsafe.user,
          start_param
        });
      } else {
        // Mock user for local dev
        setUser({ 
           id: 12345, 
           username: 'test_user', 
           first_name: 'Test', 
           start_param 
        });
      }
    } else {
      // Mock user for local dev outside Telegram
      setUser({ id: 12345, username: 'sekanedr_is', first_name: 'Admin' });
    }
  }, []);

  return user;
}
