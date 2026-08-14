/* global self, caches, fetch, URL */
/* SOLE PWA worker: public-shell resilience and push display; commerce truth stays network-owned. */
const VERSION = "sole-f15-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const CORE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/sole-192.png",
  "/icons/sole-512.png",
  "/icons/sole-maskable-512.png",
];
const PRIVATE_PREFIXES = ["/api", "/auth", "/account", "/checkout", "/cart", "/wishlist"];
const PUBLIC_PAGE_PREFIXES = ["/", "/products", "/product/", "/about", "/brands"];

const isPrivate = (pathname) =>
  PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
const isPublicPage = (pathname) =>
  PUBLIC_PAGE_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix),
  );

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("sole-f14-") && ![STATIC_CACHE, PAGE_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivate(url.pathname)) return;

  if (request.mode === "navigate") {
    if (!isPublicPage(url.pathname)) return;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/offline.html")),
    );
    return;
  }

  if (["style", "script", "font", "image"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && response.type === "basic") {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

const safeNotificationPath = (candidate) => {
  try {
    const url = new URL(candidate || "/", self.location.origin);
    if (url.origin !== self.location.origin) return "/";
    const allowed =
      url.pathname.startsWith("/product/") ||
      url.pathname === "/products" ||
      url.pathname === "/account";
    return allowed ? `${url.pathname}${url.search}` : "/";
  } catch {
    return "/";
  }
};

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" ? payload.title.slice(0, 120) : "SOLE";
  const body = typeof payload.body === "string" ? payload.body.slice(0, 240) : "اعلان جدیدی دارید.";
  const path = safeNotificationPath(payload.deepLink);
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/sole-192.png",
      badge: "/icons/sole-192.png",
      data: { path },
      tag: typeof payload.id === "string" ? payload.id.slice(0, 120) : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = safeNotificationPath(event.notification.data?.path);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        const current = new URL(client.url);
        if (current.origin === self.location.origin && "focus" in client) {
          await client.navigate(path);
          return client.focus();
        }
      }
      return self.clients.openWindow(path);
    }),
  );
});
