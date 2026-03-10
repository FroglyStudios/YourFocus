import { useCallback } from 'react';

export const useNotifications = () => {
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, type: 'break' | 'session') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: type === 'break' ? '☕' : '🎮',
        badge: '/favicon.ico',
        requireInteraction: true,
        tag: 'yourfocus-timer'
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }, []);

  return { requestPermission, showNotification };
};