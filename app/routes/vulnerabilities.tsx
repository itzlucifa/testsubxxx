import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Progress } from '../components/ui/progress/progress';
import { BackButton } from '../components/ui/back-button';
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useRealTimeVulnerabilities } from '../hooks/use-real-time-vulnerabilities';
import { useRealTimeDevices } from '../hooks/use-real-time-devices';
import { applyPatch, scanForVulnerabilities } from '../lib/vulnerability-service';
import { toast } from '../hooks/use-toast';
import styles from './vulnerabilities.module.css';

export default function Vulnerabilities() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patching, setPatching] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const { vulnerabilities, loading } = useRealTimeVulnerabilities(currentUser?.id || '');
  const { devices } = useRealTimeDevices(currentUser?.id || '');

  const handleApplyPatch = async (vulnId: string) => {
    setPatching(vulnId);
    toast({
      title: "Applying Patch",
      description: "Initiating patch deployment...",
    });

    const success = await applyPatch(vulnId);
    
    if (success) {
      toast({
        title: "Patch Applied",
        description: "Vulnerability remediation in progress",
      });
    } else {
      toast({
        title: "Patch Failed",
        description: "Unable to apply patch. Please try again.",
        variant: "destructive"
      });
    }
    
    setPatching(null);
  };

  const handleScan = async () => {
    if (!currentUser) return;
    
    toast({
      title: "Scanning Started",
      description: "Scanning all devices for vulnerabilities...",
    });

    await scanForVulnerabilities(currentUser.id);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'patching':
        return 'outline';
      case 'patched':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'var(--color-error-9)';
    if (score >= 7.0) return '#f59e0b';
    if (score >= 4.0) return 'var(--color-accent-9)';
    return 'var(--color-success-9)';
  };

  const totalVulns = vulnerabilities.length;
  const openVulns = vulnerabilities.filter((v) => v.status === 'open').length;
  const patchingVulns = vulnerabilities.filter((v) => v.status === 'patching').length;
  const patchedVulns = vulnerabilities.filter((v) => v.status === 'patched').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Vulnerability Management</h1>
          <p className={styles.subtitle}>CVE tracking and patch management</p>
        </div>
        <Button onClick={handleScan} disabled={loading}>
          <Shield size={18} />
          {loading ? 'Scanning...' : 'Scan for Vulnerabilities'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>Total Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalVulns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle size={18} className={styles.openIcon} />
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{openVulns}</div>
            <div className={styles.statSubtext}>Requiring attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Clock size={18} className={styles.patchingIcon} />
              Patching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{patchingVulns}</div>
            <div className={styles.statSubtext}>In progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <CheckCircle size={18} className={styles.patchedIcon} />
              Patched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{patchedVulns}</div>
            <div className={styles.statSubtext}>Successfully remediated</div>
          </CardContent>
        </Card>
      </div>

      {/* Vulnerabilities List */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Vulnerabilities</CardTitle>
          <CardDescription>CVE database and CVSS scoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.vulnList}>
            {loading && <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)' }}>Loading vulnerabilities...</div>}
            {!loading && vulnerabilities.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)' }}>No vulnerabilities detected. Your system is secure!</div>}
            {vulnerabilities.map((vuln) => (
              <div key={vuln.id} className={styles.vulnCard}>
                <div className={styles.vulnHeader}>
                  <div className={styles.vulnMeta}>
                    <h3 className={styles.vulnTitle}>{vuln.title}</h3>
                    <div className={styles.vulnId}>{vuln.cveId}</div>
                  </div>
                  <div className={styles.vulnBadges}>
                    <Badge variant={getSeverityColor(vuln.severity)}>{vuln.severity.toUpperCase()}</Badge>
                    <Badge variant={getStatusColor(vuln.status)}>{vuln.status.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className={styles.vulnDescription}>{vuln.description}</div>

                <div className={styles.vulnMetrics}>
                  <div className={styles.cvssScore}>
                    <span className={styles.cvssLabel}>CVSS Score:</span>
                    <span className={styles.cvssValue} style={{ color: getCVSSColor(vuln.cvssScore) }}>
                      {vuln.cvssScore.toFixed(1)}
                    </span>
                    <Progress value={vuln.cvssScore * 10} className={styles.cvssProgress} />
                  </div>

                  <div className={styles.vulnDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Discovered:</span>
                      <span>{vuln.discoveredAt.toLocaleDateString()}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Affected Devices:</span>
                      <span>{vuln.affectedDevices.length}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Patch Available:</span>
                      <span>{vuln.patchAvailable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.affectedDevices}>
                  <div className={styles.devicesLabel}>Affected Devices:</div>
                  <div className={styles.devicesList}>
                    {vuln.affectedDevices.map((deviceId) => {
                      const device = devices.find((d) => d.id === deviceId);
                      return device ? (
                        <Badge key={deviceId} variant="outline">
                          {device.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className={styles.vulnActions}>
                  {vuln.patchAvailable && vuln.status !== 'patched' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApplyPatch(vuln.id)}
                      disabled={patching === vuln.id || vuln.status === 'patching'}
                    >
                      {patching === vuln.id || vuln.status === 'patching' ? 'Patching...' : 'Apply Patch'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`, '_blank')}
                  >
                    <ExternalLink size={16} />
                    View CVE Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
