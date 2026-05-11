const CACHE_NAME = 'sam-v1';
const VIDEO_CACHE = 'video-downloads-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/downloads',
  '/manifest.json',
  '/icon.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== VIDEO_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Special handling for video files
  if (url.pathname.match(/\.(mp4|webm|m3u8|ts)$/) || url.hostname.includes('res.cloudinary.com') || url.hostname.includes('s3.amazonaws.com')) {
    event.respondWith(
      caches.open(VIDEO_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
    );
    return;
  }

  // Navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match('/downloads') || await cache.match('/');
      })
    );
    return;
  }

  // Standard static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic' || event.request.url.includes('/api/')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
