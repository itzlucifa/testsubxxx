import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Progress } from '../components/ui/progress/progress';
import { BackButton } from '../components/ui/back-button';
import { AlertTriangle, Shield, TrendingUp, Plus, Activity } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeRiskAssessment } from '../hooks/use-real-time-risk-assessment';
import styles from './common-page.module.css';

export default function RiskAssessment() {
  const { risks, loading, isDemo, mitigateRisk } = useRealTimeRiskAssessment();

  const handleMitigate = async (id: string) => {
    await mitigateRisk(id);
    toast({
      title: "Risk Mitigated",
      description: "Mitigation actions applied successfully",
    });
  };

  const getRiskLevel = (score: number) => {
    if (score >= 15) return { label: 'Critical', variant: 'destructive' as const };
    if (score >= 10) return { label: 'High', variant: 'destructive' as const };
    if (score >= 5) return { label: 'Medium', variant: 'outline' as const };
    return { label: 'Low', variant: 'secondary' as const };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified':
        return 'outline';
      case 'assessed':
        return 'default';
      case 'mitigated':
        return 'secondary';
      case 'accepted':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading risk assessments...</div>
      </div>
    );
  }

  const criticalRisks = risks.filter(r => r.riskScore >= 15 && r.status !== 'mitigated').length;
  const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;
  const avgRiskScore = risks.length > 0 ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length : 0;
  const mitigatedPercent = risks.length > 0 ? ((mitigatedRisks / risks.length) * 100).toFixed(0) : '0';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Risk Assessment</h1>
          <p className={styles.subtitle}>Identify, assess, and mitigate security risks</p>
        </div>
        <Button>
          <Plus size={18} />
          New Assessment
        </Button>
      </div>

      <div className={isDemo ? styles.demoBanner : styles.liveBanner}>
        <Activity size={16} />
        {isDemo ? (
          <span><strong>Demo Mode:</strong> Sign in to manage your actual risk assessments</span>
        ) : (
          <span><strong>Live:</strong> Connected to your risk data in real-time</span>
        )}
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle size={20} />
              Total Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{risks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Shield size={20} />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{criticalRisks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <TrendingUp size={20} />
              Mitigated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{mitigatedRisks}</div>
            <div className={styles.statSubtext}>{mitigatedPercent}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Avg Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{avgRiskScore.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.cardGrid}>
        {risks.sort((a, b) => b.riskScore - a.riskScore).map((risk) => {
          const riskLevel = getRiskLevel(risk.riskScore);
          return (
            <Card key={risk.id}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <CardTitle>{risk.asset}</CardTitle>
                    <CardDescription>{risk.threat}</CardDescription>
                  </div>
                  <Badge variant={riskLevel.variant}>
                    {riskLevel.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <Badge variant={getStatusColor(risk.status)}>
                      {risk.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      Score: {risk.riskScore}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                        Likelihood
                      </div>
                      <Progress value={risk.likelihood * 20} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-11)', marginTop: 'var(--space-1)' }}>
                        {risk.likelihood}/5
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                        Impact
                      </div>
                      <Progress value={risk.impact * 20} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-11)', marginTop: 'var(--space-1)' }}>
                        {risk.impact}/5
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      Mitigation Strategy:
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      {risk.mitigation}
                    </div>
                  </div>

                  {risk.status !== 'mitigated' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMitigate(risk.id)}
                    >
                      Apply Mitigation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
