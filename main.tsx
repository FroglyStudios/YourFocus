import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import MiniTimer from './components/MiniTimer.tsx';

const isMini = window.location.search.includes('mini=true') || window.location.hash.includes('mini=true');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isMini ? <MiniTimer /> : <App />}
  </StrictMode>
);
