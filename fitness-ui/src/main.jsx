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
