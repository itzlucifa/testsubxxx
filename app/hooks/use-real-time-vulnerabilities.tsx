import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vulnerability } from '../types';

export function useRealTimeVulnerabilities(userId?: string) {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    // Fetch initial vulnerabilities
    const fetchVulnerabilities = async () => {
      const { data, error} = await supabase!
        .from('vulnerabilities')
        .select('*')
        .eq('user_id', userId)
        .order('cvss_score', { ascending: false });

      if (!error && data) {
        setVulnerabilities(data.map(vuln => ({
          id: vuln.id,
          cveId: vuln.cve_id,
          title: vuln.title,
          description: vuln.description,
          cvssScore: vuln.cvss_score,
          severity: vuln.severity,
          status: vuln.status,
          affectedDevices: vuln.affected_devices,
          discoveredAt: new Date(vuln.discovered_at),
          patchAvailable: vuln.patch_available
        })));
      }
      setLoading(false);
    };

    fetchVulnerabilities();

    // Subscribe to vulnerability changes
    const channel = supabase!
      .channel('vulnerabilities_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vulnerabilities',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newVuln: Vulnerability = {
              id: payload.new.id,
              cveId: payload.new.cve_id,
              title: payload.new.title,
              description: payload.new.description,
              cvssScore: payload.new.cvss_score,
              severity: payload.new.severity,
              status: payload.new.status,
              affectedDevices: payload.new.affected_devices,
              discoveredAt: new Date(payload.new.discovered_at),
              patchAvailable: payload.new.patch_available
            };
            setVulnerabilities(prev => [newVuln, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setVulnerabilities(prev =>
              prev.map(vuln =>
                vuln.id === payload.new.id
                  ? {
                      ...vuln,
                      status: payload.new.status,
                      patchAvailable: payload.new.patch_available
                    }
                  : vuln
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setVulnerabilities(prev =>
              prev.filter(vuln => vuln.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { vulnerabilities, loading };
}
