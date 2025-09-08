// Hollywood Crazy Wheel - Service Worker

const CACHE_NAME = 'hollywood-crazy-wheel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/utils.js',
  '/js/audio.js',
  '/js/board.js',
  '/js/wheel.js',
  '/js/minigames.js',
  '/js/powerups.js',
  '/js/levels.js',
  '/js/economy.js',
  '/js/game.js',
  '/js/main.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400&family=Roboto:wght@300;400;700&display=swap'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('🎬 Service Worker: Caching game files');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🎬 Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});