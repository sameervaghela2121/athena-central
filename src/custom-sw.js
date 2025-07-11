self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for URLs containing `/auth/v1.0`
  if (url.pathname.includes("/auth/v1.0")) {
    event.respondWith(fetch(event.request)); // Fetch directly from the network
    console.log("Fetch directly from the network", url.pathname);
    return;
  }

  // Default fetch handling for other requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    }),
  );
});
