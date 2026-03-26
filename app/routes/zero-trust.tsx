import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Switch } from '../components/ui/switch/switch';
import { Progress } from '../components/ui/progress/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { 
  ShieldCheck, 
  CheckCircle, 
  Lock, 
  Users, 
  Network,
  Eye,
  AlertTriangle,
  Monitor,
  Activity,
  Shield,
  Database
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeZeroTrust } from '../hooks/use-real-time-zero-trust';
import styles from './common-page.module.css';

export default function ZeroTrust() {
  const {
    settings,
    policies,
    metrics,
    loading,
    updateSettings,
    togglePolicy,
    devices,
    threats,
  } = useRealTimeZeroTrust();

  const handleToggleZeroTrust = (checked: boolean) => {
    updateSettings({ zeroTrustEnabled: checked });
    toast({
      title: checked ? "Zero Trust Enabled" : "Zero Trust Disabled",
      description: checked 
        ? "All Zero Trust policies are now active" 
        : "Zero Trust architecture has been disabled",
      variant: checked ? "default" : "destructive"
    });
  };

  const handleToggleContinuousAuth = (checked: boolean) => {
    updateSettings({ continuousAuth: checked });
    toast({
      title: checked ? "Continuous Authentication Enabled" : "Continuous Authentication Disabled",
      description: checked 
        ? "Users will be continuously validated" 
        : "Users will only be authenticated at login",
    });
  };

  const handleToggleMicroSegmentation = (checked: boolean) => {
    updateSettings({ microSegmentation: checked });
    toast({
      title: checked ? "Micro-Segmentation Enabled" : "Micro-Segmentation Disabled",
      description: checked 
        ? "Network is now segmented into isolated zones" 
        : "Network segmentation has been disabled",
    });
  };

  const handleToggleLeastPrivilege = (checked: boolean) => {
    updateSettings({ leastPrivilege: checked });
    toast({
      title: checked ? "Least Privilege Enabled" : "Least Privilege Disabled",
      description: checked 
        ? "Users will have minimum required permissions" 
        : "Least privilege enforcement disabled",
    });
  };

  const handleTogglePolicy = (id: string) => {
    togglePolicy(id);
    const policy = policies.find(p => p.id === id);
    toast({
      title: policy?.enabled ? "Policy Disabled" : "Policy Enabled",
      description: policy?.name,
    });
  };

  const enabledPolicies = policies.filter(p => p.enabled).length;
  const securityPosture = metrics.overallScore >= 95 ? 'Excellent' : 
    metrics.overallScore >= 85 ? 'Good' : 
    metrics.overallScore >= 70 ? 'Fair' : 'Needs Attention';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <Users size={16} />;
      case 'device': return <Monitor size={16} />;
      case 'network': return <Network size={16} />;
      case 'data': return <Database size={16} />;
      case 'monitoring': return <Activity size={16} />;
      default: return <Shield size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BackButton />
          <h1 className={styles.title}>Zero Trust Architecture</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ textAlign: 'center' }}>
            <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Loading Zero Trust data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Zero Trust Architecture</h1>
          <p className={styles.subtitle}>Never trust, always verify - Identity-centric security</p>
        </div>
        <Badge variant={settings.zeroTrustEnabled ? 'default' : 'secondary'}>
          {settings.zeroTrustEnabled ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      </div>

      <div style={{ 
        padding: 'var(--space-3)', 
        background: 'var(--color-accent-2)', 
        border: '1px solid var(--color-accent-6)',
        borderRadius: 'var(--radius-2)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        <Activity size={18} />
        <span>
          <strong>Live Data:</strong> Monitoring {devices.length} devices, {threats.length} threats detected
        </span>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <ShieldCheck size={20} />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue} style={{ 
              color: metrics.overallScore >= 85 ? 'var(--color-success-9)' : 
                     metrics.overallScore >= 70 ? 'var(--color-warning-9)' : 'var(--color-error-9)'
            }}>
              {metrics.overallScore}%
            </div>
            <Progress value={metrics.overallScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <CheckCircle size={20} />
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{enabledPolicies}/{policies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Eye size={20} />
              Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{metrics.totalVerifications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Lock size={20} />
              Security Posture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue} style={{
              color: securityPosture === 'Excellent' ? 'var(--color-success-9)' :
                     securityPosture === 'Good' ? 'var(--color-success-9)' :
                     securityPosture === 'Fair' ? 'var(--color-warning-9)' : 'var(--color-error-9)'
            }}>
              {securityPosture}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.statsGrid} style={{ marginTop: 'var(--space-4)' }}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Users size={20} />
              Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.identityScore}%</span>
            </div>
            <Progress value={metrics.identityScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Monitor size={20} />
              Device Trust
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.deviceScore}%</span>
            </div>
            <Progress value={metrics.deviceScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Network size={20} />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.networkScore}%</span>
            </div>
            <Progress value={metrics.networkScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Activity size={20} />
              Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.monitoringScore}%</span>
            </div>
            <Progress value={metrics.monitoringScore} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="principles">Principles</TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <div className={styles.cardGrid}>
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getCategoryIcon(policy.category)}
                        {policy.name}
                      </CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => handleTogglePolicy(policy.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                        {policy.enabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                      <Badge variant={policy.compliance >= 95 ? 'default' : policy.compliance >= 80 ? 'outline' : 'destructive'}>
                        {policy.compliance}% Compliance
                      </Badge>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.875rem' }}>
                        <span>Compliance Level</span>
                        <span>{policy.compliance}%</span>
                      </div>
                      <Progress value={policy.compliance} />
                    </div>

                    {policy.issues.length > 0 && (
                      <div style={{ 
                        padding: 'var(--space-2)', 
                        background: 'var(--color-error-2)', 
                        border: '1px solid var(--color-error-6)', 
                        borderRadius: 'var(--radius-2)',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>
                          <AlertTriangle size={14} />
                          Issues Found:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.8rem' }}>
                          {policy.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {policy.issues.length === 0 && policy.compliance >= 95 && (
                      <div style={{ 
                        padding: 'var(--space-2)', 
                        background: 'var(--color-success-2)', 
                        border: '1px solid var(--color-success-6)', 
                        borderRadius: 'var(--radius-2)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)'
                      }}>
                        <CheckCircle size={14} />
                        Policy fully compliant
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Zero Trust Configuration</CardTitle>
              <CardDescription>
                Configure core Zero Trust security controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      <ShieldCheck size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Zero Trust Architecture
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      Enable complete Zero Trust security model
                    </p>
                  </div>
                  <Switch checked={settings.zeroTrustEnabled} onCheckedChange={handleToggleZeroTrust} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      <Users size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Continuous Authentication
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      Continuously verify user identity throughout session
                    </p>
                  </div>
                  <Switch checked={settings.continuousAuth} onCheckedChange={handleToggleContinuousAuth} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      <Network size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Micro-Segmentation
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      Segment network into isolated security zones
                    </p>
                  </div>
                  <Switch checked={settings.microSegmentation} onCheckedChange={handleToggleMicroSegmentation} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      <Lock size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Least Privilege Access
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      Grant minimum required permissions to users
                    </p>
                  </div>
                  <Switch checked={settings.leastPrivilege} onCheckedChange={handleToggleLeastPrivilege} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ marginTop: 'var(--space-4)' }}>
            <CardHeader>
              <CardTitle>Real-Time Verification Status</CardTitle>
              <CardDescription>
                Current verification metrics based on your actual network data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)', marginBottom: 'var(--space-1)' }}>Devices Monitored</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{devices.length}</div>
                </div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)', marginBottom: 'var(--space-1)' }}>Threats Blocked</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.blockedAttempts}</div>
                </div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)', marginBottom: 'var(--space-1)' }}>Active Sessions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.activeSessions}</div>
                </div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-2)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)', marginBottom: 'var(--space-1)' }}>Total Threats</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{threats.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="principles">
          <Card>
            <CardHeader>
              <CardTitle>Zero Trust Security Principles</CardTitle>
              <CardDescription>
                Core principles of the Zero Trust security model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  {
                    title: 'Verify Explicitly',
                    description: 'Always authenticate and authorize based on all available data points including user identity, location, device health, service or workload, data classification, and anomalies.'
                  },
                  {
                    title: 'Use Least Privilege Access',
                    description: 'Limit user access with Just-In-Time and Just-Enough-Access (JIT/JEA), risk-based adaptive policies, and data protection to help secure both data and productivity.'
                  },
                  {
                    title: 'Assume Breach',
                    description: 'Minimize blast radius and segment access. Verify end-to-end encryption and use analytics to get visibility, drive threat detection, and improve defenses.'
                  },
                  {
                    title: 'Never Trust, Always Verify',
                    description: 'Do not automatically trust anything inside or outside the network perimeters. Verify everything trying to connect before granting access.'
                  },
                  {
                    title: 'Continuous Validation',
                    description: 'Monitor and validate user and device posture continuously in real-time. Security is not a one-time event but an ongoing process.'
                  },
                  {
                    title: 'Identity-Centric Security',
                    description: 'Identity becomes the primary security perimeter. Strong authentication and authorization are critical to Zero Trust architecture.'
                  }
                ].map((principle, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      gap: 'var(--space-3)', 
                      padding: 'var(--space-3)', 
                      background: 'var(--color-neutral-2)', 
                      borderRadius: 'var(--radius-2)' 
                    }}
                  >
                    <CheckCircle 
                      size={20} 
                      style={{ 
                        marginTop: '2px', 
                        flexShrink: 0, 
                        color: 'var(--color-success-9)' 
                      }} 
                    />
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        {principle.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                        {principle.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
