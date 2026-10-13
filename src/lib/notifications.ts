import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

let channelInitialized = false;

/**
 * Initializes notification channels for Android (heads-up popup & sound)
 */
export async function initNotificationChannel(): Promise<void> {
  if (channelInitialized) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'chatbase_messages',
        name: 'ChatBase Messages',
        description: 'Instant notifications for incoming chat messages',
        importance: 5, // MAX importance - heads up banner & sound
        visibility: 1, // PUBLIC on lock screen
        vibration: true,
        lights: true,
        lightColor: '#6366F1',
      });
      channelInitialized = true;
    } catch (e) {
      console.warn('Notification channel setup:', e);
    }
  }
}

/**
 * Forcefully requests notification permission from the system/browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  await initNotificationChannel();

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.warn('Native notification permission error:', e);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    } catch (e) {
      console.warn('Web notification permission error:', e);
      return false;
    }
  }

  return false;
}

export interface SystemNotificationOptions {
  title: string;
  body: string;
  conversationId?: string;
  avatarUrl?: string;
  onClick?: () => void;
}

/**
 * Force sends a native system / web notification whenever a message arrives
 */
export async function showSystemNotification(options: SystemNotificationOptions): Promise<void> {
  const { title, body, conversationId, avatarUrl, onClick } = options;

  // 1. Native Mobile (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'ChatBase',
            body: body || 'New message received',
            id: Math.floor(Math.random() * 1000000) + 1,
            channelId: 'chatbase_messages',
            schedule: { at: new Date(Date.now() + 100) },
            extra: {
              conversationId,
            },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Failed to schedule native notification:', err);
    }
  }

  // 2. Web / PWA / Desktop Browser
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const displayNotification = () => {
        try {
          const options: any = {
            body: body || 'New message received',
            icon: avatarUrl || '/chatbase.png',
            badge: '/chatbase.png',
            tag: conversationId ? `cb_${conversationId}` : undefined,
            renotify: true,
          };
          const notif = new Notification(title || 'ChatBase', options);

          notif.onclick = () => {
            window.focus();
            if (onClick) onClick();
            notif.close();
          };
        } catch {
          // If Notification constructor fails, try serviceWorker
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              const swOptions: any = {
                body: body || 'New message received',
                icon: avatarUrl || '/chatbase.png',
                badge: '/chatbase.png',
                tag: conversationId ? `cb_${conversationId}` : undefined,
              };
              reg.showNotification(title || 'ChatBase', swOptions);
            });
          }
        }
      };

      if (Notification.permission === 'granted') {
        displayNotification();
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((res) => {
          if (res === 'granted') displayNotification();
        });
      }
    } catch (err) {
      console.warn('Failed to display web notification:', err);
    }
  }
}
