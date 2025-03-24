import React from 'react';
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initTelegramWebApp } from './utils/telegram';

// Initialize Telegram WebApp if running in Telegram
initTelegramWebApp();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
