// Service Worker for StudyBros
const CACHE_NAME = 'studybros-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/static/css/main.css',
  '/static/css/dashboard.css',
  '/static/js/pomodoro.js',
  '/static/js/notes.js',
  '/static/js/goals.js',
  '/static/js/badges.js',
  '/static/js/stats.js',
  '/static/sounds/notification.mp3',
  '/static/images/logo.png'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Clean old caches
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network Request Interception
self.addEventListener('fetch', (event) => {
  // Special handling for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // If API request fails, notify we're offline
          if (event.request.method === 'GET') {
            return new Response(
              JSON.stringify({ 
                error: true, 
                message: 'Offline mode. Limited data available without internet connection.' 
              }),
              { 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          }
          
          // For POST requests, queue for later synchronization
          if (event.request.method === 'POST') {
            // Save to IndexedDB
            saveRequestForLater(event.request.clone());
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                offline: true, 
                message: 'Data saved offline and will be synchronized when internet connection is available.' 
              }),
              { 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          }
        })
    );
  } else {
    // Cache strategy for normal page requests
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return from cache if available
          if (response) {
            return response;
          }
          
          // Request from network if not in cache
          return fetch(event.request)
            .then((response) => {
              // If not a valid response, return directly
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Add response to cache
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(() => {
              // In case of network error, show offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Store offline requests for later
function saveRequestForLater(request) {
  // Open IndexedDB
  const dbPromise = indexedDB.open('studybros-offline', 1);
  
  dbPromise.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('offline-requests')) {
      db.createObjectStore('offline-requests', { autoIncrement: true });
    }
  };
  
  dbPromise.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['offline-requests'], 'readwrite');
    const store = transaction.objectStore('offline-requests');
    
    // Clone request and convert to JSON
    request.json().then(body => {
      const requestData = {
        url: request.url,
        method: request.method,
        headers: Array.from(request.headers.entries()),
        body: body,
        timestamp: new Date().getTime()
      };
      
      // Save to IndexedDB
      store.add(requestData);
    });
  };
}

// Synchronize offline requests
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Send offline requests to server
function syncOfflineRequests() {
  return new Promise((resolve, reject) => {
    const dbPromise = indexedDB.open('studybros-offline', 1);
    
    dbPromise.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['offline-requests'], 'readwrite');
      const store = transaction.objectStore('offline-requests');
      
      // Get all requests
      const requests = store.getAll();
      
      requests.onsuccess = function() {
        const offlineRequests = requests.result;
        
        // Process each request
        Promise.all(offlineRequests.map((requestData, index) => {
          return fetch(requestData.url, {
            method: requestData.method,
            headers: new Headers(requestData.headers),
            body: JSON.stringify(requestData.body)
          })
          .then(response => {
            if (response.ok) {
              // If successful, delete the request
              store.delete(index);
            }
            return response;
          })
          .catch(error => {
            console.error('Synchronization error:', error);
          });
        }))
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject(error);
        });
      };
    };
  });
}