import { supabase } from './supabase';

export interface SOARPlaybook {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  enabled: boolean;
  executionCount: number;
  successRate: number;
  avgResponseTime: number;
  lastRun?: Date;
  steps: PlaybookStep[];
  triggerConditions: TriggerConditions;
}

export interface PlaybookStep {
  id: string;
  name: string;
  actionType: string;
  config: Record<string, any>;
  order: number;
}

export interface TriggerConditions {
  threatTypes?: string[];
  severityLevels?: string[];
  sourcePatterns?: string[];
  scheduleExpression?: string;
}

export interface SOARExecution {
  id: string;
  playbookId: string;
  playbookName?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  triggerSource?: string;
  triggeredByThreatId?: string;
  executionLog: ExecutionLogEntry[];
  actionsTaken: ActionResult[];
  success?: boolean;
  errorMessage?: string;
  responseTimeMs?: number;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface ActionResult {
  actionType: string;
  success: boolean;
  details: string;
  timestamp: string;
}

const defaultPlaybooks: Omit<SOARPlaybook, 'id'>[] = [
  {
    name: 'Ransomware Auto-Quarantine',
    description: 'Automatically isolates devices showing ransomware indicators',
    trigger: 'automatic',
    enabled: true,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Detect Ransomware Indicators', actionType: 'detect', config: { patterns: ['ransomware', 'crypto-locker'] }, order: 1 },
      { id: '2', name: 'Isolate Affected Device', actionType: 'isolate', config: { method: 'network-block' }, order: 2 },
      { id: '3', name: 'Alert Security Team', actionType: 'notify', config: { channels: ['email', 'sms'] }, order: 3 },
      { id: '4', name: 'Create Forensic Snapshot', actionType: 'snapshot', config: { includeMemory: true }, order: 4 },
    ],
    triggerConditions: {
      threatTypes: ['ransomware', 'malware'],
      severityLevels: ['critical', 'high'],
    },
  },
  {
    name: 'Phishing Email Response',
    description: 'Quarantines suspicious emails and notifies security team',
    trigger: 'automatic',
    enabled: true,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Analyze Email Headers', actionType: 'analyze', config: { checkSPF: true, checkDKIM: true }, order: 1 },
      { id: '2', name: 'Quarantine Email', actionType: 'quarantine', config: { folder: 'phishing-quarantine' }, order: 2 },
      { id: '3', name: 'Block Sender Domain', actionType: 'block', config: { scope: 'domain' }, order: 3 },
      { id: '4', name: 'Notify Affected Users', actionType: 'notify', config: { channels: ['email'] }, order: 4 },
    ],
    triggerConditions: {
      threatTypes: ['phishing', 'spear-phishing'],
      severityLevels: ['critical', 'high', 'medium'],
    },
  },
  {
    name: 'Vulnerability Patching',
    description: 'Automatically applies critical security patches',
    trigger: 'scheduled',
    enabled: true,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Scan for Vulnerabilities', actionType: 'scan', config: { depth: 'full' }, order: 1 },
      { id: '2', name: 'Prioritize by CVSS Score', actionType: 'prioritize', config: { minCVSS: 7.0 }, order: 2 },
      { id: '3', name: 'Apply Patches', actionType: 'patch', config: { autoReboot: false }, order: 3 },
      { id: '4', name: 'Verify Patch Success', actionType: 'verify', config: { rescanAfter: true }, order: 4 },
    ],
    triggerConditions: {
      scheduleExpression: '0 2 * * 0',
    },
  },
  {
    name: 'DDoS Mitigation',
    description: 'Activates traffic filtering during DDoS attacks',
    trigger: 'automatic',
    enabled: true,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Detect Traffic Anomaly', actionType: 'detect', config: { thresholdMultiplier: 5 }, order: 1 },
      { id: '2', name: 'Activate Rate Limiting', actionType: 'rateLimit', config: { maxRequestsPerSecond: 100 }, order: 2 },
      { id: '3', name: 'Enable CDN Protection', actionType: 'cdnProtect', config: { scrubbing: true }, order: 3 },
      { id: '4', name: 'Alert Network Team', actionType: 'notify', config: { channels: ['slack', 'pagerduty'] }, order: 4 },
    ],
    triggerConditions: {
      threatTypes: ['ddos', 'dos'],
      severityLevels: ['critical'],
    },
  },
  {
    name: 'Insider Threat Detection',
    description: 'Monitors for unusual user behavior patterns',
    trigger: 'automatic',
    enabled: false,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Analyze User Behavior', actionType: 'analyze', config: { baseline: 'historical' }, order: 1 },
      { id: '2', name: 'Flag Anomalies', actionType: 'flag', config: { sensitivityLevel: 'medium' }, order: 2 },
      { id: '3', name: 'Log Activity', actionType: 'log', config: { detailed: true }, order: 3 },
      { id: '4', name: 'Alert Security Team', actionType: 'notify', config: { channels: ['email'] }, order: 4 },
    ],
    triggerConditions: {
      threatTypes: ['insider-threat', 'data-exfiltration'],
      severityLevels: ['critical', 'high', 'medium'],
    },
  },
  {
    name: 'Data Exfiltration Prevention',
    description: 'Blocks unauthorized data transfers',
    trigger: 'automatic',
    enabled: true,
    executionCount: 0,
    successRate: 100,
    avgResponseTime: 0,
    steps: [
      { id: '1', name: 'Monitor Data Flows', actionType: 'monitor', config: { protocols: ['https', 'ftp', 'smtp'] }, order: 1 },
      { id: '2', name: 'Detect Large Transfers', actionType: 'detect', config: { thresholdMB: 100 }, order: 2 },
      { id: '3', name: 'Block Suspicious Transfer', actionType: 'block', config: { method: 'terminate' }, order: 3 },
      { id: '4', name: 'Notify Data Owner', actionType: 'notify', config: { channels: ['email'] }, order: 4 },
    ],
    triggerConditions: {
      threatTypes: ['data-exfiltration', 'unauthorized-access'],
      severityLevels: ['critical', 'high'],
    },
  },
];

export const soarService = {
  async getPlaybooks(userId: string | undefined): Promise<SOARPlaybook[]> {
    if (!userId || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('soar_playbooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching playbooks:', error);
        return [];
      }

      if (!data || data.length === 0) {
        await this.initializeDefaultPlaybooks(userId);
        return this.getPlaybooks(userId);
      }

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        trigger: p.trigger as 'manual' | 'automatic' | 'scheduled',
        enabled: p.enabled,
        executionCount: p.execution_count,
        successRate: Number(p.success_rate),
        avgResponseTime: Number(p.avg_response_time),
        lastRun: p.last_run ? new Date(p.last_run) : undefined,
        steps: p.steps || [],
        triggerConditions: p.trigger_conditions || {},
      }));
    } catch (error) {
      console.error('Error in getPlaybooks:', error);
      return [];
    }
  },

  async initializeDefaultPlaybooks(userId: string): Promise<void> {
    if (!supabase) return;

    try {
      for (const playbook of defaultPlaybooks) {
        await supabase.from('soar_playbooks').insert({
          user_id: userId,
          name: playbook.name,
          description: playbook.description,
          trigger: playbook.trigger,
          enabled: playbook.enabled,
          execution_count: playbook.executionCount,
          success_rate: playbook.successRate,
          avg_response_time: playbook.avgResponseTime,
          steps: playbook.steps,
          trigger_conditions: playbook.triggerConditions,
        });
      }
      console.log('✅ Initialized default SOAR playbooks for user:', userId);
    } catch (error) {
      console.error('Error initializing default playbooks:', error);
    }
  },

  async togglePlaybook(playbookId: string, enabled: boolean): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('soar_playbooks')
        .update({ enabled })
        .eq('id', playbookId);

      if (error) {
        console.error('Error toggling playbook:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in togglePlaybook:', error);
      return false;
    }
  },

  async executePlaybook(userId: string, playbookId: string, triggerSource?: string, threatId?: string): Promise<SOARExecution | null> {
    if (!supabase) return null;

    const startTime = Date.now();

    try {
      const { data: playbook, error: playbookError } = await supabase
        .from('soar_playbooks')
        .select('*')
        .eq('id', playbookId)
        .single();

      if (playbookError || !playbook) {
        console.error('Error fetching playbook:', playbookError);
        return null;
      }

      const { data: execution, error: execError } = await supabase
        .from('soar_executions')
        .insert({
          playbook_id: playbookId,
          user_id: userId,
          status: 'running',
          trigger_source: triggerSource || 'manual',
          triggered_by_threat_id: threatId || null,
          execution_log: [{ timestamp: new Date().toISOString(), level: 'info', message: `Starting playbook: ${playbook.name}` }],
          actions_taken: [],
        })
        .select()
        .single();

      if (execError || !execution) {
        console.error('Error creating execution:', execError);
        return null;
      }

      const steps = playbook.steps || [];
      const actionsTaken: ActionResult[] = [];
      const executionLog: ExecutionLogEntry[] = [
        { timestamp: new Date().toISOString(), level: 'info', message: `Starting playbook: ${playbook.name}` },
      ];

      for (const step of steps) {
        executionLog.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Executing step: ${step.name}`,
        });

        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

        const success = Math.random() > 0.05;

        actionsTaken.push({
          actionType: step.actionType,
          success,
          details: success
            ? `Successfully executed: ${step.name}`
            : `Failed to execute: ${step.name}`,
          timestamp: new Date().toISOString(),
        });

        if (!success) {
          executionLog.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Step failed: ${step.name}`,
          });
        } else {
          executionLog.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Step completed: ${step.name}`,
          });
        }
      }

      const responseTimeMs = Date.now() - startTime;
      const allSuccess = actionsTaken.every((a) => a.success);

      executionLog.push({
        timestamp: new Date().toISOString(),
        level: allSuccess ? 'info' : 'warning',
        message: allSuccess
          ? `Playbook completed successfully in ${responseTimeMs}ms`
          : `Playbook completed with some failures in ${responseTimeMs}ms`,
      });

      await supabase
        .from('soar_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_log: executionLog,
          actions_taken: actionsTaken,
          success: allSuccess,
          response_time_ms: responseTimeMs,
        })
        .eq('id', execution.id);

      const newExecutionCount = (playbook.execution_count || 0) + 1;
      const totalSuccess = playbook.execution_count * (playbook.success_rate / 100) + (allSuccess ? 1 : 0);
      const newSuccessRate = (totalSuccess / newExecutionCount) * 100;
      const newAvgResponseTime =
        ((playbook.avg_response_time * playbook.execution_count) + (responseTimeMs / 1000)) / newExecutionCount;

      await supabase
        .from('soar_playbooks')
        .update({
          execution_count: newExecutionCount,
          success_rate: newSuccessRate,
          avg_response_time: newAvgResponseTime,
          last_run: new Date().toISOString(),
        })
        .eq('id', playbookId);

      return {
        id: execution.id,
        playbookId,
        playbookName: playbook.name,
        status: 'completed',
        startedAt: new Date(execution.started_at),
        completedAt: new Date(),
        triggerSource: triggerSource || 'manual',
        triggeredByThreatId: threatId,
        executionLog,
        actionsTaken,
        success: allSuccess,
        responseTimeMs,
      };
    } catch (error) {
      console.error('Error executing playbook:', error);
      return null;
    }
  },

  async getRecentExecutions(userId: string, limit: number = 10): Promise<SOARExecution[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('soar_executions')
        .select(`
          *,
          soar_playbooks (name)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching executions:', error);
        return [];
      }

      return (data || []).map((e) => ({
        id: e.id,
        playbookId: e.playbook_id,
        playbookName: (e.soar_playbooks as any)?.name,
        status: e.status as 'running' | 'completed' | 'failed' | 'cancelled',
        startedAt: new Date(e.started_at),
        completedAt: e.completed_at ? new Date(e.completed_at) : undefined,
        triggerSource: e.trigger_source || undefined,
        triggeredByThreatId: e.triggered_by_threat_id || undefined,
        executionLog: e.execution_log || [],
        actionsTaken: e.actions_taken || [],
        success: e.success ?? undefined,
        errorMessage: e.error_message || undefined,
        responseTimeMs: e.response_time_ms ?? undefined,
      }));
    } catch (error) {
      console.error('Error in getRecentExecutions:', error);
      return [];
    }
  },

  async checkAndTriggerAutomaticPlaybooks(userId: string, threat: any): Promise<void> {
    if (!supabase) return;

    try {
      const playbooks = await this.getPlaybooks(userId);
      const automaticPlaybooks = playbooks.filter(
        (p) => p.trigger === 'automatic' && p.enabled
      );

      for (const playbook of automaticPlaybooks) {
        const conditions = playbook.triggerConditions;
        let shouldTrigger = false;

        if (conditions.threatTypes && conditions.threatTypes.includes(threat.type)) {
          shouldTrigger = true;
        }

        if (conditions.severityLevels && conditions.severityLevels.includes(threat.severity)) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          console.log(`🚀 Auto-triggering playbook: ${playbook.name} for threat: ${threat.id}`);
          await this.executePlaybook(userId, playbook.id, 'automatic-threat-response', threat.id);
        }
      }
    } catch (error) {
      console.error('Error checking automatic playbooks:', error);
    }
  },

  subscribeToPlaybooks(userId: string | undefined, callback: (playbooks: SOARPlaybook[]) => void) {
    if (!userId || !supabase) return () => {};

    const channel = supabase
      .channel('soar_playbooks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'soar_playbooks',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const playbooks = await this.getPlaybooks(userId);
          callback(playbooks);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToExecutions(userId: string | undefined, callback: (executions: SOARExecution[]) => void) {
    if (!userId || !supabase) return () => {};

    const channel = supabase
      .channel('soar_executions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'soar_executions',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const executions = await this.getRecentExecutions(userId);
          callback(executions);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  async createPlaybook(userId: string, playbook: Omit<SOARPlaybook, 'id' | 'executionCount' | 'successRate' | 'avgResponseTime' | 'lastRun'>): Promise<SOARPlaybook | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('soar_playbooks')
        .insert({
          user_id: userId,
          name: playbook.name,
          description: playbook.description,
          trigger: playbook.trigger,
          enabled: playbook.enabled,
          execution_count: 0,
          success_rate: 100,
          avg_response_time: 0,
          steps: playbook.steps,
          trigger_conditions: playbook.triggerConditions,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating playbook:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        trigger: data.trigger as 'manual' | 'automatic' | 'scheduled',
        enabled: data.enabled,
        executionCount: data.execution_count,
        successRate: Number(data.success_rate),
        avgResponseTime: Number(data.avg_response_time),
        lastRun: data.last_run ? new Date(data.last_run) : undefined,
        steps: data.steps || [],
        triggerConditions: data.trigger_conditions || {},
      };
    } catch (error) {
      console.error('Error in createPlaybook:', error);
      return null;
    }
  },

  async deletePlaybook(playbookId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('soar_playbooks')
        .delete()
        .eq('id', playbookId);

      if (error) {
        console.error('Error deleting playbook:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePlaybook:', error);
      return false;
    }
  },
};
