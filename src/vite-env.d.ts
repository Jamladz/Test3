/// <reference types="vite/client" />

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
}

interface Window {
  Adsgram?: {
    init: (config: { blockId: string }) => {
      show: () => Promise<void>;
    };
  };
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}

