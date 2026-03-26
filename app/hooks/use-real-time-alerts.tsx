import { useEffect, useState } from 'react';
import { alertService } from '../lib/real-time-services';
import type { Alert } from '../types';

export function useRealTimeAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    alertService
      .getAlerts(userId)
      .then((data) => {
        if (mounted) {
          setAlerts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    const unsubscribe = alertService.subscribeToAlerts(userId, (updatedAlerts) => {
      if (mounted) {
        setAlerts(updatedAlerts);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const createAlert = async (alert: Omit<Alert, 'id'>) => {
    if (!userId) return;
    await alertService.createAlert(userId, alert);
  };

  const markAsRead = async (alertId: string) => {
    await alertService.markAsRead(alertId);
  };

  const scanForAlerts = async () => {
    if (!userId) return false;
    return await alertService.scanForAlerts(userId);
  };

  const scanNetwork = async () => {
    if (!userId) return false;
    return await alertService.scanNetwork(userId);
  };

  return { alerts, loading, error, createAlert, markAsRead, scanForAlerts, scanNetwork };
}
