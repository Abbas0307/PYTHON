import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline Application Shell Service Worker Management
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: Register Offline Application Shell Service Worker
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // Graceful fallback if service worker unsupported or restricted
        });
    });
  } else {
    // Development: Safe unregistration and cache purge to prevent stale asset interception
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith('mindora-app-shell')) {
              caches.delete(key).catch(() => {});
            }
          }
        });
      }
    });
  }
}
