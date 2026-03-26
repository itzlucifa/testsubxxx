import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface ForensicEvidence {
  id: string;
  type: 'file_hash' | 'ip_address' | 'url' | 'email' | 'domain' | 'artifact';
  value: string;
  analysisResult?: {
    verdict: 'clean' | 'suspicious' | 'malicious' | 'unknown';
    provider: string;
    details: string;
    indicators?: Record<string, any>;
  };
  collectedAt: Date;
  analyzedAt?: Date;
}

export interface ForensicCase {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
  closedAt?: Date;
  investigator: string;
  evidence: ForensicEvidence[];
  findings: string[];
  relatedThreats: string[];
}

const demoCases: ForensicCase[] = [
  {
    id: 'demo-1',
    title: 'Ransomware Incident - Server-02',
    description: 'Potential ransomware detected on production server',
    status: 'investigating',
    priority: 'critical',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    investigator: 'Security Team',
    evidence: [
      {
        id: 'ev-1',
        type: 'file_hash',
        value: 'd41d8cd98f00b204e9800998ecf8427e',
        collectedAt: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        id: 'ev-2',
        type: 'ip_address',
        value: '185.220.101.1',
        collectedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
    findings: ['Encryption patterns detected', 'C2 server identified'],
    relatedThreats: ['Ransomware.LockBit', 'Trojan.GenericKD'],
  },
  {
    id: 'demo-2',
    title: 'Data Exfiltration Attempt',
    description: 'Unusual outbound data transfer detected',
    status: 'investigating',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    investigator: 'Forensics AI',
    evidence: [
      {
        id: 'ev-3',
        type: 'domain',
        value: 'suspicious-upload.com',
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    ],
    findings: ['Large file transfers to unknown domain', 'Compressed archives created'],
    relatedThreats: [],
  },
  {
    id: 'demo-3',
    title: 'Phishing Email Investigation',
    description: 'Employee reported suspicious email with attachment',
    status: 'open',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    investigator: 'Security Team',
    evidence: [],
    findings: [],
    relatedThreats: [],
  },
];

export function useRealTimeForensics() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ForensicCase[]>(demoCases);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('forensic_cases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCases(data.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description || '',
            status: c.status,
            priority: c.priority,
            createdAt: new Date(c.created_at),
            closedAt: c.closed_at ? new Date(c.closed_at) : undefined,
            investigator: c.investigator || 'Security Team',
            evidence: c.evidence || [],
            findings: c.findings || [],
            relatedThreats: c.related_threats || [],
          })));
        }
        setLoading(false);
      });
  }, [user]);

  const analyzeEvidence = useCallback(async (evidence: ForensicEvidence): Promise<ForensicEvidence> => {
    let actionType: string;
    let provider: string | undefined;

    switch (evidence.type) {
      case 'file_hash':
        actionType = 'scan_file';
        break;
      case 'ip_address':
        actionType = 'check_ip';
        break;
      case 'url':
        actionType = 'scan_url';
        break;
      case 'domain':
        actionType = 'check_domain';
        break;
      default:
        return evidence;
    }

    try {
      const response = await fetch('/api/security-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, target: evidence.value, provider }),
      });

      const result = await response.json();

      return {
        ...evidence,
        analysisResult: {
          verdict: result.verdict || 'unknown',
          provider: result.provider || 'Unknown',
          details: result.details || 'Analysis complete',
          indicators: result.indicators,
        },
        analyzedAt: new Date(),
      };
    } catch (error) {
      return {
        ...evidence,
        analysisResult: {
          verdict: 'unknown',
          provider: 'Error',
          details: 'Analysis failed',
        },
        analyzedAt: new Date(),
      };
    }
  }, []);

  const createCase = useCallback(async (title: string, description: string, priority: ForensicCase['priority']) => {
    const newCase: ForensicCase = {
      id: `case-${Date.now()}`,
      title,
      description,
      status: 'open',
      priority,
      createdAt: new Date(),
      investigator: user?.email || 'Security Team',
      evidence: [],
      findings: [],
      relatedThreats: [],
    };

    setCases(prev => [newCase, ...prev]);

    if (user && supabase) {
      await supabase.from('forensic_cases').insert({
        id: newCase.id,
        user_id: user.id,
        title,
        description,
        status: 'open',
        priority,
        investigator: user.email,
        evidence: [],
        findings: [],
        related_threats: [],
      });
    }

    return newCase;
  }, [user]);

  const addEvidence = useCallback(async (caseId: string, type: ForensicEvidence['type'], value: string) => {
    const evidence: ForensicEvidence = {
      id: `ev-${Date.now()}`,
      type,
      value,
      collectedAt: new Date(),
    };

    setAnalyzing(evidence.id);
    const analyzedEvidence = await analyzeEvidence(evidence);
    setAnalyzing(null);

    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const updatedEvidence = [...c.evidence, analyzedEvidence];
        
        if (user && supabase) {
          supabase.from('forensic_cases').update({
            evidence: updatedEvidence,
            status: 'investigating',
          }).eq('id', caseId);
        }

        const findings = [...c.findings];
        if (analyzedEvidence.analysisResult?.verdict === 'malicious') {
          findings.push(`Malicious ${type} detected: ${value}`);
        } else if (analyzedEvidence.analysisResult?.verdict === 'suspicious') {
          findings.push(`Suspicious ${type} requires further analysis: ${value}`);
        }

        return {
          ...c,
          status: 'investigating' as const,
          evidence: updatedEvidence,
          findings,
        };
      }
      return c;
    }));

    return analyzedEvidence;
  }, [analyzeEvidence, user]);

  const closeCase = useCallback(async (caseId: string, resolution: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const updatedCase = {
          ...c,
          status: 'closed' as const,
          closedAt: new Date(),
          findings: [...c.findings, `Resolution: ${resolution}`],
        };

        if (user && supabase) {
          supabase.from('forensic_cases').update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            findings: updatedCase.findings,
          }).eq('id', caseId);
        }

        return updatedCase;
      }
      return c;
    }));
  }, [user]);

  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status !== 'closed').length,
    criticalCases: cases.filter(c => c.priority === 'critical' && c.status !== 'closed').length,
    totalEvidence: cases.reduce((sum, c) => sum + c.evidence.length, 0),
    maliciousFindings: cases.reduce((sum, c) => 
      sum + c.evidence.filter(e => e.analysisResult?.verdict === 'malicious').length, 0
    ),
  };

  return {
    cases,
    loading,
    analyzing,
    stats,
    createCase,
    addEvidence,
    closeCase,
    analyzeEvidence,
  };
}
