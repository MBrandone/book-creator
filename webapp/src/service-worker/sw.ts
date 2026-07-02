import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CACHE_CONFIG } from './config';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_CONFIG.imageCacheName,
    plugins: [
      new ExpirationPlugin({
        maxEntries: CACHE_CONFIG.maxImageEntries,
        maxAgeSeconds: CACHE_CONFIG.maxImageAgeInDays * 24 * 60 * 60,
      }),
    ],
  })
);
