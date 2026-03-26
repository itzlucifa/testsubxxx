import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface RiskAssessment {
  id: string;
  asset: string;
  threat: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted';
}

const demoRisks: RiskAssessment[] = [
  {
    id: 'demo-1',
    asset: 'Customer Database',
    threat: 'SQL Injection Attack',
    likelihood: 4,
    impact: 5,
    riskScore: 20,
    mitigation: 'Implement parameterized queries and input validation',
    status: 'mitigated'
  },
  {
    id: 'demo-2',
    asset: 'Employee Workstations',
    threat: 'Ransomware Infection',
    likelihood: 3,
    impact: 5,
    riskScore: 15,
    mitigation: 'Deploy endpoint protection and user training',
    status: 'mitigated'
  },
  {
    id: 'demo-3',
    asset: 'Web Application',
    threat: 'DDoS Attack',
    likelihood: 4,
    impact: 4,
    riskScore: 16,
    mitigation: 'Implement rate limiting and CDN protection',
    status: 'assessed'
  },
  {
    id: 'demo-4',
    asset: 'Network Infrastructure',
    threat: 'Unauthorized Access',
    likelihood: 2,
    impact: 5,
    riskScore: 10,
    mitigation: 'Enforce zero-trust architecture',
    status: 'identified'
  },
  {
    id: 'demo-5',
    asset: 'Cloud Storage',
    threat: 'Data Breach',
    likelihood: 3,
    impact: 5,
    riskScore: 15,
    mitigation: 'Enable encryption and access controls',
    status: 'mitigated'
  },
  {
    id: 'demo-6',
    asset: 'Email System',
    threat: 'Phishing Campaign',
    likelihood: 5,
    impact: 3,
    riskScore: 15,
    mitigation: 'Deploy anti-phishing tools and user awareness',
    status: 'assessed'
  }
];

export function useRealTimeRiskAssessment() {
  const { user } = useAuth();
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client || !user || user.id === 'demo-user') {
      setRisks(demoRisks);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchRisks = async () => {
      try {
        const { data, error } = await client
          .from('risk_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('risk_score', { ascending: false });

        if (error) throw error;

        if (mounted) {
          if (data && data.length > 0) {
            const formattedRisks = data.map(r => ({
              id: r.id,
              asset: r.asset,
              threat: r.threat,
              likelihood: r.likelihood,
              impact: r.impact,
              riskScore: r.risk_score,
              mitigation: r.mitigation || '',
              status: r.status as RiskAssessment['status'],
            }));
            setRisks(formattedRisks);
            setIsDemo(false);
          } else {
            setRisks(demoRisks);
            setIsDemo(true);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching risk assessments:', error);
        if (mounted) {
          setRisks(demoRisks);
          setIsDemo(true);
          setLoading(false);
        }
      }
    };

    fetchRisks();

    const subscription = client
      .channel('risk_assessments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'risk_assessments',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (mounted) fetchRisks();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(subscription);
    };
  }, [user]);

  const mitigateRisk = async (riskId: string) => {
    if (!supabase || !user || user.id === 'demo-user') {
      setRisks(prev =>
        prev.map(r =>
          r.id === riskId ? { ...r, status: 'mitigated' as const } : r
        )
      );
      return;
    }

    await supabase
      .from('risk_assessments')
      .update({
        status: 'mitigated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', riskId);
  };

  const addRisk = async (risk: Omit<RiskAssessment, 'id'>) => {
    if (!supabase || !user || user.id === 'demo-user') {
      const newRisk = {
        ...risk,
        id: `demo-${Date.now()}`,
      };
      setRisks(prev => [...prev, newRisk]);
      return;
    }

    await supabase.from('risk_assessments').insert({
      user_id: user.id,
      asset: risk.asset,
      threat: risk.threat,
      likelihood: risk.likelihood,
      impact: risk.impact,
      risk_score: risk.riskScore,
      mitigation: risk.mitigation,
      status: risk.status,
    });
  };

  const updateRiskStatus = async (riskId: string, status: RiskAssessment['status']) => {
    if (!supabase || !user || user.id === 'demo-user') {
      setRisks(prev =>
        prev.map(r =>
          r.id === riskId ? { ...r, status } : r
        )
      );
      return;
    }

    await supabase
      .from('risk_assessments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', riskId);
  };

  return { risks, loading, isDemo, mitigateRisk, addRisk, updateRiskStatus };
}
