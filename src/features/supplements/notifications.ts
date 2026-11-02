export type NotificationState = NotificationPermission | 'unsupported';

export function notificationState(): NotificationState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestNotifications(): Promise<NotificationState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Mitteilung über den Service Worker (Android verlangt das), sonst direkt; `false` = nicht möglich */
export async function showSystemNotification(title: string, body: string): Promise<boolean> {
  if (notificationState() !== 'granted') return false;
  const options: NotificationOptions = { body, tag: 'supplements', icon: './pwa-192x192.png' };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
