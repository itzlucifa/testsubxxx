import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  violationCount: number;
  lastUpdated: Date;
  createdBy: string;
}

const demoPolicies: SecurityPolicy[] = [
  {
    id: 'demo-1',
    name: 'Strong Password Requirement',
    description: 'Passwords must be at least 12 characters with mixed case, numbers, and symbols',
    category: 'Authentication',
    enabled: true,
    violationCount: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    createdBy: 'Security Team'
  },
  {
    id: 'demo-2',
    name: 'MFA Enforcement',
    description: 'Multi-factor authentication required for all users',
    category: 'Authentication',
    enabled: true,
    violationCount: 2,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    createdBy: 'Admin'
  },
  {
    id: 'demo-3',
    name: 'Data Encryption at Rest',
    description: 'All sensitive data must be encrypted using AES-256',
    category: 'Data Protection',
    enabled: true,
    violationCount: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    createdBy: 'Security Team'
  },
  {
    id: 'demo-4',
    name: 'Regular Security Training',
    description: 'All employees must complete quarterly security awareness training',
    category: 'Training',
    enabled: true,
    violationCount: 5,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    createdBy: 'HR'
  },
  {
    id: 'demo-5',
    name: 'USB Device Restrictions',
    description: 'Unknown USB devices are automatically blocked',
    category: 'Device Control',
    enabled: true,
    violationCount: 12,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdBy: 'Security Team'
  },
  {
    id: 'demo-6',
    name: 'Network Segmentation',
    description: 'Guest networks must be isolated from internal systems',
    category: 'Network Security',
    enabled: true,
    violationCount: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    createdBy: 'Network Team'
  }
];

export function useRealTimePolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client || !user || user.id === 'demo-user') {
      setPolicies(demoPolicies);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchPolicies = async () => {
      try {
        const { data, error } = await client
          .from('security_policies')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;

        if (mounted) {
          if (data && data.length > 0) {
            const formattedPolicies = data.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              category: p.category,
              enabled: p.enabled,
              violationCount: p.violation_count,
              lastUpdated: new Date(p.last_updated),
              createdBy: p.created_by || 'System',
            }));
            setPolicies(formattedPolicies);
            setIsDemo(false);
          } else {
            setPolicies(demoPolicies);
            setIsDemo(true);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching security policies:', error);
        if (mounted) {
          setPolicies(demoPolicies);
          setIsDemo(true);
          setLoading(false);
        }
      }
    };

    fetchPolicies();

    const subscription = client
      .channel('security_policies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_policies',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (mounted) fetchPolicies();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(subscription);
    };
  }, [user]);

  const togglePolicy = async (policyId: string) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;

    if (!supabase || !user || user.id === 'demo-user') {
      setPolicies(prev =>
        prev.map(p =>
          p.id === policyId ? { ...p, enabled: !p.enabled } : p
        )
      );
      return;
    }

    await supabase
      .from('security_policies')
      .update({
        enabled: !policy.enabled,
        last_updated: new Date().toISOString(),
      })
      .eq('id', policyId);
  };

  const deletePolicy = async (policyId: string) => {
    if (!supabase || !user || user.id === 'demo-user') {
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      return;
    }

    await supabase
      .from('security_policies')
      .delete()
      .eq('id', policyId);
  };

  const addPolicy = async (policy: Omit<SecurityPolicy, 'id'>) => {
    if (!supabase || !user || user.id === 'demo-user') {
      const newPolicy = {
        ...policy,
        id: `demo-${Date.now()}`,
      };
      setPolicies(prev => [...prev, newPolicy]);
      return;
    }

    await supabase.from('security_policies').insert({
      user_id: user.id,
      name: policy.name,
      description: policy.description,
      category: policy.category,
      enabled: policy.enabled,
      violation_count: policy.violationCount,
      created_by: policy.createdBy,
    });
  };

  return { policies, loading, isDemo, togglePolicy, deletePolicy, addPolicy };
}
