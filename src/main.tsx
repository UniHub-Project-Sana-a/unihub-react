import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Automatic recovery when a Vite dynamic chunk returns 404 (due to fresh deployment)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    console.warn("Vite preload error detected. Auto-reloading to fetch newest version...", event);
    window.location.reload();
  });

  window.addEventListener("error", (event) => {
    if (
      event?.message &&
      (event.message.includes("Failed to fetch dynamically imported module") ||
        event.message.includes("error loading dynamically imported module") ||
        event.message.includes("Importing a module script failed"))
    ) {
      const key = "chunk_reload_lock";
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 8000) {
        sessionStorage.setItem(key, String(Date.now()));
        console.warn("Stale chunk detected. Reloading page to update application...");
        window.location.reload();
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
