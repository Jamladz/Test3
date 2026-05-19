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

      if (twa.initDataUnsafe?.user) {
        setUser({
          ...twa.initDataUnsafe.user,
          start_param: twa.initDataUnsafe.start_param
        });
      } else {
        // Mock user for local dev
        setUser({ id: 12345, username: 'test_user', first_name: 'Test', start_param: new URLSearchParams(window.location.search).get('start_param') || undefined });
      }
    } else {
      // Mock user for local dev outside Telegram
      setUser({ id: 12345, username: 'sekanedr_is', first_name: 'Admin' });
    }
  }, []);

  return user;
}
