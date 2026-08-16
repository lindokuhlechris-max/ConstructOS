import { Reminder } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;
const NOTIFIED_CACHE_KEY = 'constructos_notified_reminders_v1';

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markReminderNotified(id: string) {
  try {
    const set = getNotifiedSet();
    set.add(id);
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to update notified reminders cache', err);
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this environment');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = registration;
    console.log('ConstructOS Reminder Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export async function triggerNotification(payload: {
  title: string;
  description?: string;
  priority?: string;
  reminderId?: string;
  link?: string;
}): Promise<boolean> {
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }

  // Ensure SW is registered
  if (!swRegistration && 'serviceWorker' in navigator) {
    swRegistration = await navigator.serviceWorker.getRegistration();
  }

  if (swRegistration && swRegistration.active) {
    swRegistration.active.postMessage({
      type: 'TRIGGER_NOTIFICATION',
      payload
    });
    return true;
  } else if ('Notification' in window) {
    // Fallback to standard web notification
    new Notification(`🔔 ConstructOS Reminder: ${payload.title}`, {
      body: payload.description || 'A site task activity reminder requires your attention.',
      icon: '/favicon.ico',
      tag: payload.reminderId ? `reminder-${payload.reminderId}` : undefined
    });
    return true;
  }

  return false;
}

export async function triggerTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (!swRegistration && 'serviceWorker' in navigator) {
    swRegistration = await navigator.serviceWorker.getRegistration();
  }

  if (swRegistration && swRegistration.active) {
    swRegistration.active.postMessage({ type: 'TEST_NOTIFICATION' });
    return true;
  } else {
    return triggerNotification({
      title: 'Service Worker Active',
      description: 'Test notification from ConstructOS reminder listener.'
    });
  }
}

/**
  * Checks active reminders and triggers service worker notifications for items due
  */
export function checkDueReminders(reminders: Reminder[]): Reminder[] {
  if (!reminders || reminders.length === 0) return [];

  const notifiedSet = getNotifiedSet();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const dueReminders: Reminder[] = [];

  reminders.forEach(reminder => {
    if (reminder.status !== 'Pending') return;
    if (notifiedSet.has(reminder.id)) return;

    // Determine if reminder is due
    let isDue = false;
    
    if (reminder.dueDate < todayStr) {
      // Overdue item
      isDue = true;
    } else if (reminder.dueDate === todayStr) {
      if (!reminder.dueTime) {
        // Due today (no specific time set)
        isDue = true;
      } else if (reminder.dueTime <= currentTimeStr) {
        // Due time has arrived or passed today
        isDue = true;
      }
    }

    if (isDue) {
      dueReminders.push(reminder);
      markReminderNotified(reminder.id);

      // Send to Service Worker
      triggerNotification({
        title: reminder.title,
        description: `${reminder.description ? reminder.description + ' — ' : ''}Priority: ${reminder.priority}`,
        priority: reminder.priority,
        reminderId: reminder.id,
        link: '/reminders'
      });

      // Dispatch custom browser event for in-app toast
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('constructos-reminder-due', {
          detail: reminder
        }));
      }
    }
  });

  return dueReminders;
}
