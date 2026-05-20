import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl = 'https://jamladz.github.io/Raija/tonconnect-manifest.json';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
          twaReturnUrl: 'https://t.me/PlushTap_bot',
          notifications: ['before', 'success'],
          modals: ['before', 'success']
      }}
    >
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
);
