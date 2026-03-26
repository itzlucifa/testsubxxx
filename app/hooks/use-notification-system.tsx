import { useEffect, useState, useCallback } from 'react';
import { alertService } from '../lib/real-time-services';
import type { Alert } from '../types';

export function useNotificationSystem(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new alerts
    const unsubscribe = alertService.subscribeToAlerts(userId, (alerts) => {
      // Get the most recent unread alert
      const newAlerts = alerts
        .filter(a => !a.read)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (newAlerts.length > 0) {
        const latest = newAlerts[0];
        // Only show notification if it's a new alert we haven't seen
        if (latest.id !== lastAlertId) {
          setNotifications(prev => {
            // Keep max 3 notifications visible
            const updated = [latest, ...prev].slice(0, 3);
            return updated;
          });
          setLastAlertId(latest.id);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, lastAlertId]);

  const removeNotification = useCallback((alertId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== alertId));
  }, []);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await alertService.markAsRead(alertId);
      removeNotification(alertId);
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, [removeNotification]);

  return {
    notifications,
    removeNotification,
    markAsRead,
  };
}
