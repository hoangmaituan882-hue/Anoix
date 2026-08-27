import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './app/App.tsx';
import './index.css';

// Apply stored theme before first paint
const storedTheme = localStorage.getItem('anoix-theme') === 'light' ? 'light' : 'dark';
document.documentElement.classList.toggle('light', storedTheme === 'light');
document.documentElement.classList.toggle('dark', storedTheme === 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
