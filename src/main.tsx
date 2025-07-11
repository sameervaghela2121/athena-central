import * as Sentry from "@sentry/react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n/i18n";

// Initialize Sentry
// Only initialize Sentry in production environment
if (window.location.hostname !== "localhost") {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
  });
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  window.location.hostname !== "localhost" ? (
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <App />
    </Sentry.ErrorBoundary>
  ) : (
    <App />
  ),
);

// Register the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.debug("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
        Sentry.captureException(error);
      });
  });
}
