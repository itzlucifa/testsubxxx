import { useState, useEffect, useCallback } from 'react';
import { soarService, type SOARPlaybook, type SOARExecution } from '../lib/soar-service';
import { useAuth } from './use-auth';
import { executeSecurityActionClient, type SecurityActionRequest } from '../lib/security-actions-client';

export interface UseRealTimeSOARReturn {
  playbooks: SOARPlaybook[];
  executions: SOARExecution[];
  isLoading: boolean;
  error: string | null;
  togglePlaybook: (playbookId: string) => Promise<void>;
  executePlaybook: (playbookId: string, testTarget?: string) => Promise<SOARExecution | null>;
  refreshPlaybooks: () => Promise<void>;
  refreshExecutions: () => Promise<void>;
  executingPlaybookId: string | null;
  isDemoMode: boolean;
}

const DEMO_PLAYBOOKS: SOARPlaybook[] = [
  {
    id: 'demo-ip-check',
    name: 'IP Reputation Check',
    description: 'Check if an IP address is malicious using AbuseIPDB and AlienVault threat intelligence',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check IP Reputation', actionType: 'check_ip', config: { provider: 'abuseipdb' }, order: 1 },
      { id: '2', name: 'Threat Intel Lookup', actionType: 'threat_intel_lookup', config: { provider: 'alienvault' }, order: 2 },
      { id: '3', name: 'Generate Report', actionType: 'report', config: {}, order: 3 },
    ],
    triggerConditions: {},
    executionCount: 28,
    successRate: 100,
    avgResponseTime: 1.2,
    lastRun: new Date(Date.now() - 1800000),
  },
  {
    id: 'demo-url-scan',
    name: 'URL Malware Scanner',
    description: 'Scan suspicious URLs for malware using VirusTotal (requires API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Scan URL', actionType: 'scan_url', config: { provider: 'virustotal' }, order: 1 },
      { id: '2', name: 'Analyze Results', actionType: 'analyze', config: {}, order: 2 },
      { id: '3', name: 'Block if Malicious', actionType: 'block', config: {}, order: 3 },
    ],
    triggerConditions: {},
    executionCount: 156,
    successRate: 98.5,
    avgResponseTime: 2.1,
    lastRun: new Date(Date.now() - 3600000),
  },
  {
    id: 'demo-breach-check',
    name: 'Password Breach Checker',
    description: 'Check if a password has been exposed in data breaches using Have I Been Pwned (FREE - no API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check Password Breaches', actionType: 'check_password_breach', config: { provider: 'hibp' }, order: 1 },
      { id: '2', name: 'Show Results', actionType: 'report', config: {}, order: 2 },
    ],
    triggerConditions: {},
    executionCount: 89,
    successRate: 100,
    avgResponseTime: 0.8,
    lastRun: new Date(Date.now() - 7200000),
  },
  {
    id: 'demo-urlhaus',
    name: 'Malware URL Scanner',
    description: 'Check if a URL is distributing malware using URLhaus (FREE - no API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check Malware URL', actionType: 'check_malware_url', config: { provider: 'urlhaus' }, order: 1 },
      { id: '2', name: 'Show Results', actionType: 'report', config: {}, order: 2 },
    ],
    triggerConditions: {},
    executionCount: 42,
    successRate: 100,
    avgResponseTime: 0.6,
    lastRun: new Date(Date.now() - 5400000),
  },
  {
    id: 'demo-malwarebazaar',
    name: 'Malware Hash Lookup',
    description: 'Check if a file hash (MD5/SHA256) is known malware using MalwareBazaar (FREE - no API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check Malware Hash', actionType: 'check_malware_hash', config: { provider: 'malwarebazaar' }, order: 1 },
      { id: '2', name: 'Show Results', actionType: 'report', config: {}, order: 2 },
    ],
    triggerConditions: {},
    executionCount: 67,
    successRate: 100,
    avgResponseTime: 0.5,
    lastRun: new Date(Date.now() - 4200000),
  },
  {
    id: 'demo-phishtank',
    name: 'Phishing URL Detector',
    description: 'Check if a URL is a known phishing site using PhishTank (FREE - no API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check Phishing URL', actionType: 'check_phishing', config: { provider: 'phishtank' }, order: 1 },
      { id: '2', name: 'Show Results', actionType: 'report', config: {}, order: 2 },
    ],
    triggerConditions: {},
    executionCount: 38,
    successRate: 100,
    avgResponseTime: 0.7,
    lastRun: new Date(Date.now() - 3000000),
  },
  {
    id: 'demo-shodan',
    name: 'Exposed Services Scanner',
    description: 'Check what ports/services are exposed on an IP using Shodan (requires API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Scan Exposed Services', actionType: 'check_exposed_services', config: { provider: 'shodan' }, order: 1 },
      { id: '2', name: 'Analyze Vulnerabilities', actionType: 'analyze', config: {}, order: 2 },
      { id: '3', name: 'Generate Report', actionType: 'report', config: {}, order: 3 },
    ],
    triggerConditions: {},
    executionCount: 15,
    successRate: 100,
    avgResponseTime: 1.8,
    lastRun: new Date(Date.now() - 2400000),
  },
  {
    id: 'demo-greynoise',
    name: 'Scanner/Attacker Detection',
    description: 'Check if an IP is a known internet scanner or attacker using GreyNoise (FREE - no API key)',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Check Scanner Status', actionType: 'check_scanner_ip', config: { provider: 'greynoise' }, order: 1 },
      { id: '2', name: 'Show Results', actionType: 'report', config: {}, order: 2 },
    ],
    triggerConditions: {},
    executionCount: 52,
    successRate: 100,
    avgResponseTime: 0.9,
    lastRun: new Date(Date.now() - 1800000),
  },
  {
    id: 'demo-1',
    name: 'Ransomware Response',
    description: 'Automated response to ransomware detection including isolation and backup verification',
    trigger: 'automatic',
    enabled: true,
    steps: [
      { id: '1', name: 'Isolate Device', actionType: 'isolate', config: {}, order: 1 },
      { id: '2', name: 'Kill Process', actionType: 'terminate', config: {}, order: 2 },
      { id: '3', name: 'Backup Check', actionType: 'verify', config: {}, order: 3 },
      { id: '4', name: 'Alert Team', actionType: 'notify', config: {}, order: 4 },
    ],
    triggerConditions: { threatTypes: ['ransomware'] },
    executionCount: 12,
    successRate: 95.5,
    avgResponseTime: 2.3,
    lastRun: new Date(Date.now() - 3600000),
  },
  {
    id: 'demo-2',
    name: 'Phishing Email Handler',
    description: 'Process suspected phishing emails, extract indicators, and block sender',
    trigger: 'automatic',
    enabled: true,
    steps: [
      { id: '1', name: 'Analyze Email', actionType: 'analyze', config: {}, order: 1 },
      { id: '2', name: 'Extract URLs', actionType: 'extract', config: {}, order: 2 },
      { id: '3', name: 'Block Sender', actionType: 'block', config: {}, order: 3 },
      { id: '4', name: 'Notify User', actionType: 'notify', config: {}, order: 4 },
    ],
    triggerConditions: { threatTypes: ['phishing'] },
    executionCount: 45,
    successRate: 98.2,
    avgResponseTime: 1.5,
    lastRun: new Date(Date.now() - 1800000),
  },
  {
    id: 'demo-3',
    name: 'DDoS Mitigation',
    description: 'Activate traffic filtering and enable rate limiting during DDoS attacks',
    trigger: 'automatic',
    enabled: true,
    steps: [
      { id: '1', name: 'Enable Rate Limit', actionType: 'ratelimit', config: {}, order: 1 },
      { id: '2', name: 'Activate CDN', actionType: 'cdn', config: {}, order: 2 },
      { id: '3', name: 'Block IPs', actionType: 'block', config: {}, order: 3 },
    ],
    triggerConditions: { threatTypes: ['ddos'] },
    executionCount: 8,
    successRate: 92.0,
    avgResponseTime: 4.2,
    lastRun: new Date(Date.now() - 86400000),
  },
  {
    id: 'demo-4',
    name: 'Vulnerability Scan',
    description: 'Weekly automated vulnerability scanning of network assets',
    trigger: 'scheduled',
    enabled: true,
    steps: [
      { id: '1', name: 'Scan Network', actionType: 'scan', config: {}, order: 1 },
      { id: '2', name: 'Analyze Results', actionType: 'analyze', config: {}, order: 2 },
      { id: '3', name: 'Create Report', actionType: 'report', config: {}, order: 3 },
    ],
    triggerConditions: { scheduleExpression: '0 0 * * 0' },
    executionCount: 24,
    successRate: 100,
    avgResponseTime: 120.5,
    lastRun: new Date(Date.now() - 604800000),
  },
  {
    id: 'demo-5',
    name: 'User Account Lockout',
    description: 'Lock user accounts after multiple failed login attempts',
    trigger: 'automatic',
    enabled: false,
    steps: [
      { id: '1', name: 'Lock Account', actionType: 'lock', config: {}, order: 1 },
      { id: '2', name: 'Notify Admin', actionType: 'notify', config: {}, order: 2 },
      { id: '3', name: 'Log Event', actionType: 'log', config: {}, order: 3 },
    ],
    triggerConditions: { threatTypes: ['brute-force'] },
    executionCount: 156,
    successRate: 99.8,
    avgResponseTime: 0.8,
    lastRun: new Date(Date.now() - 7200000),
  },
  {
    id: 'demo-6',
    name: 'Incident Forensics',
    description: 'Manual forensic data collection for security incidents',
    trigger: 'manual',
    enabled: true,
    steps: [
      { id: '1', name: 'Collect Logs', actionType: 'collect', config: {}, order: 1 },
      { id: '2', name: 'Snapshot Memory', actionType: 'snapshot', config: {}, order: 2 },
      { id: '3', name: 'Preserve Evidence', actionType: 'preserve', config: {}, order: 3 },
      { id: '4', name: 'Generate Report', actionType: 'report', config: {}, order: 4 },
    ],
    triggerConditions: {},
    executionCount: 5,
    successRate: 100,
    avgResponseTime: 45.0,
    lastRun: new Date(Date.now() - 172800000),
  },
];

export function useRealTimeSOAR(): UseRealTimeSOARReturn {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<SOARPlaybook[]>([]);
  const [executions, setExecutions] = useState<SOARExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingPlaybookId, setExecutingPlaybookId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const refreshPlaybooks = useCallback(async () => {
    if (isDemoMode) {
      return;
    }
    if (!user?.id) return;
    
    try {
      const data = await soarService.getPlaybooks(user.id);
      setPlaybooks(data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing playbooks:', err);
      setError('Failed to load playbooks');
    }
  }, [user?.id, isDemoMode]);

  const refreshExecutions = useCallback(async () => {
    if (isDemoMode) {
      return;
    }
    if (!user?.id) return;
    
    try {
      const data = await soarService.getRecentExecutions(user.id);
      setExecutions(data);
    } catch (err) {
      console.error('Error refreshing executions:', err);
    }
  }, [user?.id, isDemoMode]);

  const togglePlaybook = useCallback(async (playbookId: string) => {
    const playbook = playbooks.find(p => p.id === playbookId);
    if (!playbook) return;

    const newEnabled = !playbook.enabled;
    
    setPlaybooks(prev =>
      prev.map(p =>
        p.id === playbookId ? { ...p, enabled: newEnabled } : p
      )
    );

    if (!isDemoMode) {
      const success = await soarService.togglePlaybook(playbookId, newEnabled);
      
      if (!success) {
        setPlaybooks(prev =>
          prev.map(p =>
            p.id === playbookId ? { ...p, enabled: !newEnabled } : p
          )
        );
        setError('Failed to toggle playbook');
      }
    }
  }, [playbooks, isDemoMode]);

  const executePlaybook = useCallback(async (playbookId: string, testTarget?: string): Promise<SOARExecution | null> => {
    const playbook = playbooks.find(p => p.id === playbookId);
    if (!playbook) return null;
    
    setExecutingPlaybookId(playbookId);
    const startTime = Date.now();
    const executionLog: { timestamp: string; level: 'info' | 'warning' | 'error'; message: string }[] = [];
    const actionsTaken: { actionType: string; success: boolean; details: string; timestamp: string }[] = [];
    
    executionLog.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Playbook execution started' });
    
    const securityActionTypes = ['check_ip', 'scan_url', 'scan_file', 'check_domain', 'check_email_breach', 'threat_intel_lookup'];
    
    for (const step of playbook.steps) {
      if (securityActionTypes.includes(step.actionType) && testTarget) {
        try {
          executionLog.push({ timestamp: new Date().toISOString(), level: 'info', message: `Executing ${step.name}...` });
          
          const result = await executeSecurityActionClient({
            actionType: step.actionType as any,
            target: testTarget,
            provider: step.config?.provider,
          });
          
          if (result.success && result.result) {
            const r = result.result;
            actionsTaken.push({
              actionType: step.actionType,
              success: r.success,
              details: r.details,
              timestamp: new Date().toISOString(),
            });
            
            const level = r.verdict === 'malicious' ? 'warning' : 'info';
            executionLog.push({ 
              timestamp: new Date().toISOString(), 
              level, 
              message: `${step.name}: ${r.details}${r.verdict ? ` (Verdict: ${r.verdict})` : ''}` 
            });
          } else {
            actionsTaken.push({
              actionType: step.actionType,
              success: false,
              details: result.error || 'Action failed',
              timestamp: new Date().toISOString(),
            });
            executionLog.push({ 
              timestamp: new Date().toISOString(), 
              level: 'error', 
              message: `${step.name} failed: ${result.error || 'Unknown error'}` 
            });
          }
        } catch (err) {
          actionsTaken.push({
            actionType: step.actionType,
            success: false,
            details: err instanceof Error ? err.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        actionsTaken.push({
          actionType: step.actionType,
          success: true,
          details: `${step.name} completed (simulated)`,
          timestamp: new Date().toISOString(),
        });
        executionLog.push({ timestamp: new Date().toISOString(), level: 'info', message: `${step.name} completed` });
      }
    }
    
    executionLog.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Playbook execution completed' });
    
    const responseTimeMs = Date.now() - startTime;
    const allSuccess = actionsTaken.every(a => a.success);
    
    if (isDemoMode) {
      const demoExecution: SOARExecution = {
        id: `demo-exec-${Date.now()}`,
        playbookId,
        playbookName: playbook.name,
        status: 'completed',
        triggerSource: 'manual',
        success: allSuccess,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        responseTimeMs,
        executionLog,
        actionsTaken,
      };
      
      setExecutions(prev => [demoExecution, ...prev].slice(0, 10));
      
      setPlaybooks(prev =>
        prev.map(p =>
          p.id === playbookId
            ? { ...p, executionCount: p.executionCount + 1, lastRun: new Date() }
            : p
        )
      );
      
      setExecutingPlaybookId(null);
      return demoExecution;
    }
    
    if (!user?.id) {
      setExecutingPlaybookId(null);
      return null;
    }
    
    try {
      const execution = await soarService.executePlaybook(user.id, playbookId, 'manual');
      
      if (execution) {
        setExecutions(prev => [execution, ...prev].slice(0, 10));
        await refreshPlaybooks();
      }
      
      return execution;
    } catch (err) {
      console.error('Error executing playbook:', err);
      setError('Failed to execute playbook');
      return null;
    } finally {
      setExecutingPlaybookId(null);
    }
  }, [user?.id, playbooks, isDemoMode, refreshPlaybooks]);

  useEffect(() => {
    if (!user?.id) {
      console.log('🎭 SOAR: No user - loading demo mode');
      setPlaybooks(DEMO_PLAYBOOKS);
      setExecutions([]);
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    setIsDemoMode(false);
    setIsLoading(true);

    Promise.all([
      soarService.getPlaybooks(user.id),
      soarService.getRecentExecutions(user.id),
    ])
      .then(([playbooksData, executionsData]) => {
        setPlaybooks(playbooksData);
        setExecutions(executionsData);
        setError(null);
      })
      .catch((err) => {
        console.error('Error loading SOAR data:', err);
        setError('Failed to load SOAR data');
      })
      .finally(() => {
        setIsLoading(false);
      });

    const unsubscribePlaybooks = soarService.subscribeToPlaybooks(user.id, setPlaybooks);
    const unsubscribeExecutions = soarService.subscribeToExecutions(user.id, setExecutions);

    return () => {
      unsubscribePlaybooks();
      unsubscribeExecutions();
    };
  }, [user?.id]);

  return {
    playbooks,
    executions,
    isLoading,
    error,
    togglePlaybook,
    executePlaybook,
    refreshPlaybooks,
    refreshExecutions,
    executingPlaybookId,
    isDemoMode,
  };
}
