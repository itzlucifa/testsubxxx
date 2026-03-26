import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Switch } from '../components/ui/switch/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { 
  Workflow, 
  Play, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Zap,
  Activity,
  Shield,
  History,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Globe,
  Mail,
  X
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeSOAR } from '../hooks/use-real-time-soar';
import { useAuth } from '../hooks/use-auth';
import styles from './common-page.module.css';

export default function SOAR() {
  const { user } = useAuth();
  const { 
    playbooks, 
    executions, 
    isLoading, 
    error, 
    togglePlaybook, 
    executePlaybook, 
    refreshPlaybooks,
    executingPlaybookId,
    isDemoMode 
  } = useRealTimeSOAR();
  const [activeTab, setActiveTab] = useState('all');
  const [testTarget, setTestTarget] = useState('');
  const [showTestInput, setShowTestInput] = useState<string | null>(null);

  const securityPlaybookIds = [
    'demo-ip-check', 
    'demo-url-scan', 
    'demo-breach-check',
    'demo-urlhaus',
    'demo-malwarebazaar',
    'demo-phishtank',
    'demo-shodan',
    'demo-greynoise'
  ];
  const isSecurityPlaybook = (id: string) => securityPlaybookIds.includes(id);

  const getPlaceholderForPlaybook = (id: string) => {
    switch (id) {
      case 'demo-ip-check': return 'Enter IP address (e.g., 8.8.8.8)';
      case 'demo-url-scan': return 'Enter URL (e.g., https://example.com)';
      case 'demo-breach-check': return 'Enter password to check';
      case 'demo-urlhaus': return 'Enter URL to check for malware';
      case 'demo-malwarebazaar': return 'Enter file hash (MD5 or SHA256)';
      case 'demo-phishtank': return 'Enter URL to check for phishing';
      case 'demo-shodan': return 'Enter IP to scan for exposed services';
      case 'demo-greynoise': return 'Enter IP to check if known scanner';
      default: return 'Enter target';
    }
  };

  const handleTogglePlaybook = async (id: string) => {
    const playbook = playbooks.find(p => p.id === id);
    if (!playbook) return;

    await togglePlaybook(id);
    
    toast({
      title: playbook.enabled ? "Playbook Disabled" : "Playbook Enabled",
      description: playbook.name,
    });
  };

  const handleExecutePlaybook = async (id: string, target?: string) => {
    const playbook = playbooks.find(p => p.id === id);
    if (!playbook) return;

    if (isSecurityPlaybook(id) && !target) {
      setShowTestInput(id);
      return;
    }

    setShowTestInput(null);
    setTestTarget('');

    toast({
      title: "Executing Playbook",
      description: `Running ${playbook.name}...`,
    });

    const execution = await executePlaybook(id, target);

    if (execution) {
      const hasRealResults = execution.actionsTaken.some(a => !a.details.includes('simulated'));
      toast({
        title: execution.success ? "Playbook Completed" : "Playbook Completed with Issues",
        description: hasRealResults 
          ? `${playbook.name} - Real security scan completed`
          : `${playbook.name} executed in ${(execution.responseTimeMs || 0) / 1000}s`,
      });
    } else {
      toast({
        title: "Execution Failed",
        description: `Failed to execute ${playbook.name}`,
        variant: "destructive",
      });
    }
  };

  const getTriggerBadgeVariant = (trigger: string) => {
    switch (trigger) {
      case 'automatic':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'manual':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const totalExecutions = playbooks.reduce((sum, p) => sum + p.executionCount, 0);
  const avgSuccessRate = playbooks.length > 0 
    ? playbooks.reduce((sum, p) => sum + p.successRate, 0) / playbooks.length 
    : 0;
  const avgResponseTime = playbooks.length > 0 
    ? playbooks.reduce((sum, p) => sum + p.avgResponseTime, 0) / playbooks.length 
    : 0;
  const enabledPlaybooks = playbooks.filter(p => p.enabled).length;

  const filteredPlaybooks = activeTab === 'all' 
    ? playbooks 
    : playbooks.filter(p => p.trigger === activeTab);


  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <BackButton />
            <h1 className={styles.title}>SOAR Platform</h1>
            <p className={styles.subtitle}>Security Orchestration, Automation & Response</p>
          </div>
        </div>
        <Card>
          <CardContent style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <Loader2 size={48} style={{ margin: '0 auto var(--space-4)', animation: 'spin 1s linear infinite' }} />
            <h3>Loading Playbooks...</h3>
            <p style={{ color: 'var(--color-neutral-11)', marginTop: 'var(--space-2)' }}>
              Fetching your SOAR configuration from the database.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>SOAR Platform</h1>
          <p className={styles.subtitle}>Security Orchestration, Automation & Response</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={refreshPlaybooks}>
            <RefreshCw size={18} />
            Refresh
          </Button>
          <Button>
            <Settings size={18} />
            Configure Platform
          </Button>
        </div>
      </div>

      {error && (
        <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-error-9)' }}>
          <CardContent style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertCircle size={20} style={{ color: 'var(--color-error-9)' }} />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {isDemoMode && (
        <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-accent-9)', backgroundColor: 'var(--color-accent-2)' }}>
          <CardContent style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Shield size={20} style={{ color: 'var(--color-accent-9)' }} />
            <span>
              <strong>Demo Mode</strong> - You're viewing sample playbooks. Log in to save your configurations to the database.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Activity size={20} />
              Active Playbooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{enabledPlaybooks}/{playbooks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Zap size={20} />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <CheckCircle size={20} />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{avgSuccessRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Clock size={20} />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{avgResponseTime.toFixed(1)}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      {executions.length > 0 && (
        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <History size={20} />
              Recent Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {executions.slice(0, 5).map((execution) => (
                <div 
                  key={execution.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--color-neutral-2)',
                    borderRadius: 'var(--radius-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Badge variant={getStatusBadgeVariant(execution.status)}>
                      {execution.status.toUpperCase()}
                    </Badge>
                    <span style={{ fontWeight: 500 }}>{execution.playbookName || 'Unknown Playbook'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                    <span>{execution.triggerSource}</span>
                    <span>•</span>
                    <span>{execution.responseTimeMs ? `${(execution.responseTimeMs / 1000).toFixed(1)}s` : 'N/A'}</span>
                    <span>•</span>
                    <span>{execution.startedAt.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playbooks */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="all">All Playbooks ({playbooks.length})</TabsTrigger>
          <TabsTrigger value="automatic">Automatic ({playbooks.filter(p => p.trigger === 'automatic').length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({playbooks.filter(p => p.trigger === 'scheduled').length})</TabsTrigger>
          <TabsTrigger value="manual">Manual ({playbooks.filter(p => p.trigger === 'manual').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredPlaybooks.length === 0 ? (
            <Card>
              <CardContent style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <Workflow size={48} style={{ margin: '0 auto var(--space-4)', color: 'var(--color-neutral-9)' }} />
                <h3>No Playbooks Found</h3>
                <p style={{ color: 'var(--color-neutral-11)', marginTop: 'var(--space-2)' }}>
                  {activeTab === 'all' 
                    ? 'Create your first playbook to automate security responses.'
                    : `No ${activeTab} playbooks configured.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={styles.cardGrid}>
              {filteredPlaybooks.map((playbook) => (
                <Card key={playbook.id}>
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <CardTitle>{playbook.name}</CardTitle>
                        <CardDescription>{playbook.description}</CardDescription>
                      </div>
                      <Switch
                        checked={playbook.enabled}
                        onCheckedChange={() => handleTogglePlaybook(playbook.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <Badge variant={getTriggerBadgeVariant(playbook.trigger)}>
                          {playbook.trigger.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {playbook.executionCount} runs
                        </Badge>
                        <Badge variant="outline">
                          {playbook.successRate.toFixed(1)}% success
                        </Badge>
                      </div>

                      {playbook.steps && playbook.steps.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-10)' }}>
                          {playbook.steps.length} automated steps
                        </div>
                      )}

                      <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                        Avg response: {playbook.avgResponseTime.toFixed(1)}s
                        {playbook.lastRun && (
                          <> • Last run: {playbook.lastRun.toLocaleTimeString()}</>
                        )}
                      </div>

                      {showTestInput === playbook.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={testTarget}
                              onChange={(e) => setTestTarget(e.target.value)}
                              placeholder={getPlaceholderForPlaybook(playbook.id)}
                              style={{
                                flex: 1,
                                padding: 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-2)',
                                border: '1px solid var(--color-neutral-7)',
                                background: 'var(--color-neutral-2)',
                                color: 'var(--color-neutral-12)',
                                fontSize: '0.875rem',
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && testTarget.trim()) {
                                  handleExecutePlaybook(playbook.id, testTarget.trim());
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowTestInput(null);
                                setTestTarget('');
                              }}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleExecutePlaybook(playbook.id, testTarget.trim())}
                              disabled={!testTarget.trim() || executingPlaybookId === playbook.id}
                            >
                              {executingPlaybookId === playbook.id ? (
                                <>
                                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                  Scanning...
                                </>
                              ) : (
                                <>
                                  <Search size={16} />
                                  Run Scan
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleExecutePlaybook(playbook.id)}
                            disabled={!playbook.enabled || executingPlaybookId === playbook.id}
                          >
                            {executingPlaybookId === playbook.id ? (
                              <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Executing...
                              </>
                            ) : (
                              <>
                                {isSecurityPlaybook(playbook.id) ? <Search size={16} /> : <Play size={16} />}
                                {isSecurityPlaybook(playbook.id) ? 'Test Now' : 'Run Now'}
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings size={16} />
                            Configure
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
