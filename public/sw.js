// ConstructOS Service Worker - Reminder Notification Listener
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the client application
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'TRIGGER_NOTIFICATION' || type === 'REMINDER_DUE') {
    const { title, description, priority, reminderId, link } = payload || {};

    const notificationTitle = `🔔 ConstructOS Reminder: ${title || 'Task Due'}`;
    const options = {
      body: description || 'A site task activity reminder requires your attention.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: reminderId ? `reminder-${reminderId}` : `reminder-${Date.now()}`,
      renotify: true,
      requireInteraction: priority === 'Critical' || priority === 'High',
      data: {
        url: link || '/reminders',
        reminderId: reminderId
      },
      vibrate: priority === 'Critical' ? [300, 100, 300, 100, 300] : [200, 100, 200],
      actions: [
        { action: 'open', title: '📋 Open Reminders' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, options)
    );
  } else if (type === 'TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification('🔔 ConstructOS Test Alert', {
        body: 'Service worker notification listener is active and working properly!',
        tag: 'test-notification',
        data: { url: '/reminders' },
        vibrate: [100, 50, 100]
      })
    );
  }
});

// Handle user clicking on a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/reminders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
