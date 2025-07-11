self.addEventListener("install", (event) => {
  // console.log("[Service Worker] Install event triggered");
  // Skip waiting to activate the service worker immediately after installation
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // console.log("[Service Worker] Activate event triggered");
  // Clean up any existing caches (if any were created in the past)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        }),
      );
    }),
  );
  // Claim clients so the service worker takes control immediately
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // console.log(`[Service Worker] Fetch request: ${event.request.url}`);
  // Do not interfere with fetch requests; let them go directly to the network
});
