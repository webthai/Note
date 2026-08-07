/**
 * Service Worker for Note.
 * - Caches the app shell so the UI still loads when offline / on a flaky connection.
 * - Never caches calls to the Apps Script API (network only — data must stay fresh).
 * - Shows/handles local notifications triggered from js/notifications.js.
 */

const CACHE_NAME = 'note-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './calendar.html',
  './notes.html',
  './tasks.html',
  './settings.html',
  './css/style.css',
  './js/config.js',
  './js/api.js',
  './js/auth.js',
  './js/ui.js',
  './js/calendar-widget.js',
  './js/notifications.js',
  './js/pwa.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache the Apps Script API — always go to the network for live data.
  if (url.hostname.includes('script.google') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./dashboard.html'));
    })
  );
});

// Clicking a notification focuses an open tab, or opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : './dashboard.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) { client.navigate(targetUrl); return client.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
