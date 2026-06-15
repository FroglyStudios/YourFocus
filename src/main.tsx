import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import MiniTimer from './components/MiniTimer.tsx';
import { themeService } from './services/themeService.ts';

// Initialize theme service as early as possible but after imports
themeService.init();

const isMini = window.location.search.includes('mini=true') || window.location.hash.includes('mini=true');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isMini ? <MiniTimer /> : <App />}
  </StrictMode>
);
