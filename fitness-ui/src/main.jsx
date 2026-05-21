import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { startKeepalivePing } from './api/client';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Start keepalive ping system to prevent Render cold starts
startKeepalivePing();

// Register service worker for PWA functionality - TEMPORARILY DISABLED
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then((registration) => {
//         console.log('ServiceWorker registration successful with scope: ', registration.scope);
//       })
//       .catch((error) => {
//         console.log('ServiceWorker registration failed: ', error);
//       });
//   });
// }
