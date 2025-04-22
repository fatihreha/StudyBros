// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/js/service-worker.js')
      .then(registration => {
        console.log('Service Worker successfully registered:', registration.scope);
        
        // For synchronizing offline requests
        if ('SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            // Periodic synchronization
            setInterval(() => {
              if (navigator.onLine) {
                registration.sync.register('sync-data');
              }
            }, 60000); // Check every minute
            
            // Synchronize when online
            window.addEventListener('online', () => {
              registration.sync.register('sync-data');
            });
          });
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Offline/Online status monitoring
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  showNotification('Connection Established', 'Internet connection restored. Your data is being synchronized.', 'success');
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
  showNotification('Offline Mode', 'No internet connection. You are working in offline mode.', 'warning');
});

// Notification display function
function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 5000);
}

// Offline Status Check
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  const statusElement = document.getElementById('connection-status');
  if (!statusElement) return;
  
  if (navigator.onLine) {
    statusElement.textContent = 'Online';
    statusElement.className = 'status-online';
    
    // Synchronize offline data
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.sync.register('sync-study-sessions');
          registration.sync.register('sync-notes');
        })
        .catch((error) => {
          console.error('Synchronization registration failed:', error);
        });
    }
  } else {
    statusElement.textContent = 'Offline';
    statusElement.className = 'status-offline';
  }
}

// Update status when page loads
document.addEventListener('DOMContentLoaded', updateOnlineStatus);