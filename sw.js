// Service Worker for Background Task Reminders
const CACHE_NAME = 'task-reminder-v1';
const NOTIFICATION_TAG = 'task-reminder';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Background sync for reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'task-reminder-sync') {
    console.log('Background sync triggered for task reminders');
    event.waitUntil(checkPendingReminders());
  }
});

// Check for pending reminders - precise timing
async function checkPendingReminders() {
  try {
    // Get reminders from IndexedDB
    const reminders = await getRemindersFromDB();
    const now = Date.now();
    
    console.log('Service Worker checking reminders at:', new Date().toLocaleString());
    
    // Filter and process reminders more precisely
    const dueReminders = reminders.filter(reminder => {
      if (reminder.done || reminder.notified) return false;
      const reminderTime = new Date(reminder.time).getTime();
      const timeDiff = now - reminderTime;
      
      // Trigger if reminder time has passed (within last 10 seconds for precision)
      return timeDiff >= 0 && timeDiff <= 10000;
    });
    
    console.log('Due reminders found:', dueReminders.length);
    
    // Process all due reminders
    for (const reminder of dueReminders) {
      console.log('Triggering background notification for:', reminder.name);
      await showNotification(reminder);
      await markReminderNotified(reminder.id);
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

// Get reminders from IndexedDB
async function getRemindersFromDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskReminderDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['reminders'], 'readonly');
      const store = transaction.objectStore('reminders');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Mark reminder as notified
async function markReminderNotified(reminderId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskReminderDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      
      const getRequest = store.get(reminderId);
      getRequest.onsuccess = () => {
        const reminder = getRequest.result;
        if (reminder) {
          reminder.notified = true;
          const putRequest = store.put(reminder);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Show notification for reminder with speech
async function showNotification(reminder) {
  const options = {
    body: `Time: ${new Date(reminder.time).toLocaleString()}`,
    tag: `reminder-${reminder.id}`, // Unique tag for each reminder
    requireInteraction: true, // Force user to interact for cross-screen visibility
    silent: false, // Allow notification sound
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI2ZmNDQ0NCIvPgo8cGF0aCBkPSJNOCAxMmw0IDRsOC04IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzRhOTBlMiIvPgo8cGF0aCBkPSJNOCAxMmw0IDRsOC04IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==',
    actions: [
      {
        action: 'mark-done',
        title: '✅ Done'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 5min'
      }
    ],
    data: {
      reminderId: reminder.id,
      url: self.location.origin,
      taskName: reminder.name
    }
  };

  // Show notification with high priority
  await self.registration.showNotification(`⏰ REMINDER: ${reminder.name}`, options);
  
  // Trigger speech through main thread
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'SPEAK_REMINDER',
      taskName: reminder.name
    });
  }
  
  // Also try to focus any open windows
  for (const client of clients) {
    if (client.focus) {
      client.focus();
    }
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'mark-done') {
    // Mark reminder as done
    markReminderDone(event.notification.data.reminderId);
  } else if (event.action === 'snooze') {
    // Snooze reminder for 5 minutes
    snoozeReminder(event.notification.data.reminderId, 5);
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow(event.notification.data.url);
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Mark reminder as done
async function markReminderDone(reminderId) {
  try {
    // Update localStorage through messaging to main thread
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'MARK_DONE',
        reminderId: parseInt(reminderId)
      });
    }
  } catch (error) {
    console.error('Error marking reminder as done:', error);
  }
}

// Snooze reminder
async function snoozeReminder(reminderId, minutes) {
  try {
    // Update localStorage through messaging to main thread
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'SNOOZE',
        reminderId: parseInt(reminderId),
        minutes: minutes
      });
    }
    
    // Show snooze notification
    await self.registration.showNotification(
      'Reminder Snoozed',
      {
        body: `Reminder will appear again in ${minutes} minutes`,
        tag: 'snooze-notification'
      }
    );
  } catch (error) {
    console.error('Error snoozing reminder:', error);
  }
}

// Periodic background sync - check every 5 seconds for more precise timing
setInterval(() => {
  self.registration.sync.register('task-reminder-sync');
}, 5000); // Check every 5 seconds for more precise reminders

// Also check immediately when service worker starts
self.registration.sync.register('task-reminder-sync');

console.log('Service Worker loaded and ready');
