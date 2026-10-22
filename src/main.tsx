import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './lib/store.tsx' // ADDED IMPORT

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider> {/* ADDED PROVIDER */}
      <App />
    </StoreProvider>
  </StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
