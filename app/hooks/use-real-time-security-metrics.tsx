import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SecurityMetrics } from '../types';

export function useRealTimeSecurityMetrics(userId?: string) {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatsBlocked: 0,
    vulnerabilitiesFixed: 0,
    devicesProtected: 0,
    uptime: 0,
    securityScore: 0,
    deepfakesBlocked: 0,
    portsSecured: 0,
    autoRemediations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        // Fetch threats blocked
        const { count: threatsCount } = await supabase!
          .from('threats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('blocked', true);

        // Fetch vulnerabilities fixed
        const { count: vulnerabilitiesCount } = await supabase!
          .from('vulnerabilities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'patched');

        // Fetch devices count
        const { count: devicesCount } = await supabase!
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Calculate security score based on various factors
        const securityScore = Math.min(100, Math.max(0, 
          90 - (threatsCount || 0) * 0.1 + (vulnerabilitiesCount || 0) * 0.05
        ));

        // Fetch deepfakes blocked (if we have a deepfakes table or add to threats table)
        const { count: deepfakesCount } = await supabase!
          .from('threats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .ilike('type', '%deepfake%');

        // Fetch auto remediations
        const { count: autoRemediationsCount } = await supabase!
          .from('threats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('auto_remediated', true);

        // Calculate ports secured based on devices with closed ports
        const { data: devicesWithOpenPorts } = await supabase!
          .from('devices')
          .select('open_ports')
          .eq('user_id', userId);

        const portsSecured = devicesWithOpenPorts?.reduce((acc, device) => {
          return acc + (device.open_ports?.length || 0);
        }, 0) || 0;

        const newMetrics: SecurityMetrics = {
          threatsBlocked: threatsCount || 0,
          vulnerabilitiesFixed: vulnerabilitiesCount || 0,
          devicesProtected: devicesCount || 0,
          uptime: 99.9, // This could be calculated from system logs if available
          securityScore: Math.round(securityScore),
          deepfakesBlocked: deepfakesCount || 0,
          portsSecured: portsSecured,
          autoRemediations: autoRemediationsCount || 0,
        };

        if (mounted) {
          setMetrics(newMetrics);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching security metrics:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    // Set up real-time subscription to update metrics when data changes
    const threatsSubscription = supabase!
      .channel('security_metrics_threats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'threats',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchMetrics()
      )
      .subscribe();

    const vulnSubscription = supabase!
      .channel('security_metrics_vulns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vulnerabilities',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchMetrics()
      )
      .subscribe();

    const devicesSubscription = supabase!
      .channel('security_metrics_devices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      mounted = false;
      if (supabase) {
        supabase.removeChannel(threatsSubscription);
        supabase.removeChannel(vulnSubscription);
        supabase.removeChannel(devicesSubscription);
      }
    };
  }, [userId]);

  return { metrics, loading };
}