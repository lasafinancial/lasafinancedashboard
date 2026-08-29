import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker for PWA auto-update and offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("New content available, reloading...");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);

