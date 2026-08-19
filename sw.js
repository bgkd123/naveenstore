// =====================================================
//  SERVICE WORKER - OFFLINE SUPPORT
// =====================================================

const CACHE_NAME = 'naveen-store-v1';
const ASSETS = [
    '.',
    'index.html',
    'pasplash.webm',
    'manifest.json',
    'sw.js',
    // External CDN assets
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// ===== INSTALL - Cache assets =====
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: Caching assets');
                return cache.addAll(ASSETS);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// ===== ACTIVATE - Clean old caches =====
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cache) {
                        if (cache !== CACHE_NAME) {
                            console.log('Service Worker: Removing old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(function() {
                return self.clients.claim();
            })
    );
});

// ===== FETCH - Serve from cache or network =====
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(cachedResponse) {
                // Return cached response if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // Cache the fetched response for future
                        return caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch(function() {
                        // Fallback for offline
                        return new Response('Offline - Please connect to internet', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});