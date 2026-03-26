import { useEffect, useState } from 'react';
import { threatService } from '../lib/real-time-services';
import type { Threat } from '../types';

export function useRealTimeThreats(userId: string | undefined) {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    threatService
      .getThreats(userId)
      .then((data) => {
        if (mounted) {
          setThreats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    const unsubscribe = threatService.subscribeToThreats(userId, (updatedThreats) => {
      if (mounted) {
        setThreats(updatedThreats);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const addThreat = async (threat: Omit<Threat, 'id'>) => {
    if (!userId) return;
    await threatService.addThreat(userId, threat);
  };

  const scanForThreats = async () => {
    if (!userId) return false;
    return await threatService.scanForThreats(userId);
  };

  return { threats, loading, error, addThreat, scanForThreats };
}
