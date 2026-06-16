import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider 
      manifestUrl="https://jamladz.github.io/Test3/tonconnect-manifest.json"
      actionsConfiguration={{
          twaReturnUrl: 'https://t.me/PlushTap_bot/app'
      }}
    >
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
);
