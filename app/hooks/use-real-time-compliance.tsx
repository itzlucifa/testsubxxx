import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface ComplianceFramework {
  id: string;
  framework: string;
  score: number;
  certified: boolean;
  lastAudit: Date;
  nextAudit: Date;
  controls: number;
  compliantControls: number;
}

const demoFrameworks: ComplianceFramework[] = [
  {
    id: 'demo-1',
    framework: 'ISO 27001',
    score: 94,
    certified: true,
    lastAudit: new Date('2024-01-15'),
    nextAudit: new Date('2025-01-15'),
    controls: 114,
    compliantControls: 107
  },
  {
    id: 'demo-2',
    framework: 'SOC 2 Type II',
    score: 96,
    certified: true,
    lastAudit: new Date('2024-02-20'),
    nextAudit: new Date('2025-02-20'),
    controls: 64,
    compliantControls: 62
  },
  {
    id: 'demo-3',
    framework: 'GDPR',
    score: 92,
    certified: true,
    lastAudit: new Date('2024-03-10'),
    nextAudit: new Date('2025-03-10'),
    controls: 99,
    compliantControls: 91
  },
  {
    id: 'demo-4',
    framework: 'PCI DSS',
    score: 88,
    certified: false,
    lastAudit: new Date('2024-04-05'),
    nextAudit: new Date('2025-04-05'),
    controls: 329,
    compliantControls: 290
  },
  {
    id: 'demo-5',
    framework: 'HIPAA',
    score: 85,
    certified: false,
    lastAudit: new Date('2024-05-12'),
    nextAudit: new Date('2025-05-12'),
    controls: 45,
    compliantControls: 38
  },
  {
    id: 'demo-6',
    framework: 'NIST CSF',
    score: 91,
    certified: true,
    lastAudit: new Date('2024-06-08'),
    nextAudit: new Date('2025-06-08'),
    controls: 108,
    compliantControls: 98
  }
];

export function useRealTimeCompliance() {
  const { user } = useAuth();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client || !user || user.id === 'demo-user') {
      setFrameworks(demoFrameworks);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchFrameworks = async () => {
      try {
        const { data, error } = await client
          .from('compliance_frameworks')
          .select('*')
          .eq('user_id', user.id)
          .order('framework', { ascending: true });

        if (error) throw error;

        if (mounted) {
          if (data && data.length > 0) {
            const formattedFrameworks = data.map(f => ({
              id: f.id,
              framework: f.framework,
              score: f.score,
              certified: f.certified,
              lastAudit: new Date(f.last_audit),
              nextAudit: new Date(f.next_audit),
              controls: f.controls,
              compliantControls: f.compliant_controls,
            }));
            setFrameworks(formattedFrameworks);
            setIsDemo(false);
          } else {
            setFrameworks(demoFrameworks);
            setIsDemo(true);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching compliance frameworks:', error);
        if (mounted) {
          setFrameworks(demoFrameworks);
          setIsDemo(true);
          setLoading(false);
        }
      }
    };

    fetchFrameworks();

    const subscription = client
      .channel('compliance_frameworks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_frameworks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (mounted) fetchFrameworks();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(subscription);
    };
  }, [user]);

  const runAudit = async (frameworkId: string) => {
    if (!supabase || !user || user.id === 'demo-user') {
      setFrameworks(prev =>
        prev.map(f =>
          f.id === frameworkId
            ? {
                ...f,
                lastAudit: new Date(),
                score: Math.min(f.score + Math.floor(Math.random() * 3), 100)
              }
            : f
        )
      );
      return;
    }

    const framework = frameworks.find(f => f.id === frameworkId);
    if (!framework) return;

    const newScore = Math.min(framework.score + Math.floor(Math.random() * 3), 100);
    
    await supabase
      .from('compliance_frameworks')
      .update({
        last_audit: new Date().toISOString(),
        score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', frameworkId);
  };

  const addFramework = async (framework: Omit<ComplianceFramework, 'id'>) => {
    if (!supabase || !user || user.id === 'demo-user') {
      const newFramework = {
        ...framework,
        id: `demo-${Date.now()}`,
      };
      setFrameworks(prev => [...prev, newFramework]);
      return;
    }

    await supabase.from('compliance_frameworks').insert({
      user_id: user.id,
      framework: framework.framework,
      score: framework.score,
      certified: framework.certified,
      last_audit: framework.lastAudit.toISOString(),
      next_audit: framework.nextAudit.toISOString(),
      controls: framework.controls,
      compliant_controls: framework.compliantControls,
    });
  };

  return { frameworks, loading, isDemo, runAudit, addFramework };
}
