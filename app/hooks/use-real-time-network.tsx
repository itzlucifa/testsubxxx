import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { networkMonitor } from '../lib/network-monitor';
import type { NetworkMetrics, NetworkEvent } from '../types';

export function useRealTimeNetwork(userId: string) {
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    bandwidth: { download: 0, upload: 0 },
    latency: 0,
    packetLoss: 0,
    activeConnections: 0,
    connectionQuality: 'good'
  });
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastNetworkCheck, setLastNetworkCheck] = useState<Date>(new Date());

  // Fetch network events function
  const fetchEvents = useCallback(async () => {
    if (!supabase || !userId) return;
    
    setLoading(true);
    const { data, error } = await supabase!
      .from('network_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (!error && data) {
      setEvents(data.map(event => ({
        id: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type,
        description: event.description,
        severity: event.severity
      })));
    }
    setLoading(false);
  }, [userId]);

  // Create network event in database
  const createNetworkEvent = useCallback(async (type: string, description: string, severity: string) => {
    if (!supabase || !userId) return;
    
    try {
      await supabase
        .from('network_events')
        .insert({
          user_id: userId,
          timestamp: new Date().toISOString(),
          type,
          description,
          severity
        });
    } catch (error) {
      console.error('Failed to create network event:', error);
    }
  }, [userId]);

  // Fetch current network metrics - uses Raspberry Pi if available, otherwise browser APIs
  const fetchMetrics = useCallback(async () => {
    try {
      // Get metrics from network monitor which will check for Raspberry Pi availability
      const networkMetrics = await networkMonitor.getNetworkMetrics();
      
      setMetrics(networkMetrics);
      setLastNetworkCheck(new Date());

      // Log network status changes as events
      const timeSinceLastCheck = Date.now() - lastNetworkCheck.getTime();
      if (timeSinceLastCheck > 10000) { // Only log every 10 seconds
        if (!navigator.onLine) {
          await createNetworkEvent('disconnection', 'Network connection lost', 'critical');
        } else if (networkMetrics.connectionQuality === 'poor') {
          await createNetworkEvent('alert', `Poor network quality detected (${networkMetrics.connectionQuality})`, 'high');
        } else if (networkMetrics.connectionQuality === 'excellent') {
          await createNetworkEvent('connection', `Network performing well (${networkMetrics.connectionQuality})`, 'low');
        }
      }

    } catch (error) {
      console.error('Error fetching network metrics:', error);
      // Fallback to basic metrics
      setMetrics({
        bandwidth: { download: 0, upload: 0 },
        latency: 0,
        packetLoss: 0,
        activeConnections: 0,
        connectionQuality: navigator.onLine ? 'good' : 'poor'
      });
    }
  }, [createNetworkEvent, lastNetworkCheck]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    fetchEvents();
    fetchMetrics();
  }, [fetchEvents, fetchMetrics]);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchEvents();
    fetchMetrics();

    // Monitor online/offline status
    const handleOnline = async () => {
      await createNetworkEvent('connection', 'Network connection restored', 'low');
      fetchMetrics();
    };

    const handleOffline = async () => {
      await createNetworkEvent('disconnection', 'Network connection lost', 'critical');
      fetchMetrics();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor network changes if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const handleConnectionChange = async () => {
      fetchMetrics();
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        
        if (effectiveType === 'slow-2g' || downlink < 0.5) {
          await createNetworkEvent('alert', 'Very slow network detected', 'high');
        } else if (effectiveType === '4g' && downlink > 10) {
          await createNetworkEvent('connection', 'High-speed network detected', 'low');
        }
      }
    };

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Subscribe to new network events from database
    const channel = supabase!
      .channel('network_events_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'network_events',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newEvent: NetworkEvent = {
              id: payload.new.id,
              timestamp: new Date(payload.new.timestamp),
              type: payload.new.type,
              description: payload.new.description,
              severity: payload.new.severity
            };
            setEvents(prev => [newEvent, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    // Auto-update metrics every 5 seconds
    const metricsInterval = setInterval(() => {
      fetchMetrics();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      channel.unsubscribe();
      clearInterval(metricsInterval);
    };
  }, [userId, refreshKey, fetchEvents, fetchMetrics, createNetworkEvent]);

  return { metrics, events, loading, refresh };
}
