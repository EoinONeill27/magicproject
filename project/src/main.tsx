import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Set up title update function
export const updatePageTitle = (title: string) => {
  const baseTitle = 'ManaLog';
  document.title = title ? `${title} | ${baseTitle}` : baseTitle;
};

// Set default title
updatePageTitle('');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
