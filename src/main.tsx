import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/*
 * Locator: brauzerda komponent ustiga bosib kodga o'tish. Faqat ishlab
 * chiqishda yuklanadi va ishlab chiqarish qurilmasiga tushmaydi —
 * `import.meta.env.DEV` yolg'on bo'lganda bu shox butunlay olib
 * tashlanadi.
 */
if (import.meta.env.DEV) {
  void import('@locator/runtime').then(({ default: setupLocatorUI }) => {
    setupLocatorUI();
  });
}
