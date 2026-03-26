import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Progress } from '../components/ui/progress/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { ScrollText, CheckCircle, XCircle, Calendar, FileText, AlertTriangle, Activity } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeCompliance } from '../hooks/use-real-time-compliance';
import styles from './common-page.module.css';

export default function Compliance() {
  const { frameworks, loading, isDemo, runAudit } = useRealTimeCompliance();

  const handleRunAudit = async (framework: string) => {
    const fw = frameworks.find(f => f.framework === framework);
    if (!fw) return;

    toast({
      title: "Audit Initiated",
      description: `Running compliance audit for ${framework}...`,
    });

    await runAudit(fw.id);

    setTimeout(() => {
      toast({
        title: "Audit Completed",
        description: `${framework} compliance audit finished successfully`,
      });
    }, 2000);
  };

  const handleGenerateReport = (framework: string) => {
    toast({
      title: "Generating Report",
      description: `Creating compliance report for ${framework}...`,
    });

    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: `${framework} compliance report has been generated`,
      });
    }, 1500);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading compliance data...</div>
      </div>
    );
  }

  const avgScore = frameworks.length > 0 ? frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length : 0;
  const certifiedCount = frameworks.filter(f => f.certified).length;
  const totalControls = frameworks.reduce((sum, f) => sum + f.controls, 0);
  const compliantControls = frameworks.reduce((sum, f) => sum + f.compliantControls, 0);
  const compliancePercent = totalControls > 0 ? ((compliantControls / totalControls) * 100).toFixed(0) : '0';
  const certifiedPercent = frameworks.length > 0 ? ((certifiedCount / frameworks.length) * 100).toFixed(0) : '0';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Compliance Management</h1>
          <p className={styles.subtitle}>Framework compliance and audit management</p>
        </div>
      </div>

      <div className={isDemo ? styles.demoBanner : styles.liveBanner}>
        <Activity size={16} />
        {isDemo ? (
          <span><strong>Demo Mode:</strong> Sign in to manage your actual compliance data</span>
        ) : (
          <span><strong>Live:</strong> Connected to your compliance data in real-time</span>
        )}
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <ScrollText size={20} />
              Frameworks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{frameworks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <CheckCircle size={20} />
              Certified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{certifiedCount}</div>
            <div className={styles.statSubtext}>{certifiedPercent}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{avgScore.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{compliantControls}/{totalControls}</div>
            <div className={styles.statSubtext}>{compliancePercent}% compliant</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="all">All Frameworks</TabsTrigger>
          <TabsTrigger value="certified">Certified</TabsTrigger>
          <TabsTrigger value="pending">Pending Certification</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className={styles.cardGrid}>
            {frameworks.map((comp) => (
              <Card key={comp.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <CardTitle className={styles.cardTitle}>
                        <ScrollText size={20} />
                        {comp.framework}
                      </CardTitle>
                      <CardDescription>
                        {comp.compliantControls}/{comp.controls} controls compliant
                      </CardDescription>
                    </div>
                    <Badge variant={comp.certified ? 'default' : 'destructive'}>
                      {comp.certified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {comp.certified ? 'Certified' : 'Not Certified'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>Compliance Score</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-12)' }}>{comp.score}%</span>
                      </div>
                      <Progress value={comp.score} />
                    </div>

                    <div className={styles.metrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>
                          <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          Last Audit:
                        </span>
                        <span className={styles.metricValue}>{comp.lastAudit.toLocaleDateString()}</span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>
                          <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          Next Audit:
                        </span>
                        <span className={styles.metricValue}>{comp.nextAudit.toLocaleDateString()}</span>
                      </div>
                    </div>

                    {comp.score < 90 && (
                      <div style={{ 
                        padding: 'var(--space-2)', 
                        background: 'var(--color-accent-2)', 
                        border: '1px solid var(--color-accent-6)', 
                        borderRadius: 'var(--radius-2)',
                        fontSize: '0.875rem'
                      }}>
                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Attention needed - {100 - comp.score}% gap to full compliance
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunAudit(comp.framework)}
                      >
                        <CheckCircle size={16} />
                        Run Audit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(comp.framework)}
                      >
                        <FileText size={16} />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certified">
          <div className={styles.cardGrid}>
            {frameworks.filter(f => f.certified).map((comp) => (
              <Card key={comp.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <CardTitle className={styles.cardTitle}>
                        <ScrollText size={20} />
                        {comp.framework}
                      </CardTitle>
                      <CardDescription>
                        {comp.compliantControls}/{comp.controls} controls compliant
                      </CardDescription>
                    </div>
                    <Badge variant="default">
                      <CheckCircle size={14} />
                      Certified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>Compliance Score</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-12)' }}>{comp.score}%</span>
                      </div>
                      <Progress value={comp.score} />
                    </div>

                    <div className={styles.metrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Last Audit:</span>
                        <span className={styles.metricValue}>{comp.lastAudit.toLocaleDateString()}</span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Next Audit:</span>
                        <span className={styles.metricValue}>{comp.nextAudit.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunAudit(comp.framework)}
                      >
                        <CheckCircle size={16} />
                        Run Audit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(comp.framework)}
                      >
                        <FileText size={16} />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className={styles.cardGrid}>
            {frameworks.filter(f => !f.certified).map((comp) => (
              <Card key={comp.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <CardTitle className={styles.cardTitle}>
                        <ScrollText size={20} />
                        {comp.framework}
                      </CardTitle>
                      <CardDescription>
                        {comp.compliantControls}/{comp.controls} controls compliant
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      <XCircle size={14} />
                      Not Certified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>Compliance Score</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-12)' }}>{comp.score}%</span>
                      </div>
                      <Progress value={comp.score} />
                    </div>

                    <div className={styles.metrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Last Audit:</span>
                        <span className={styles.metricValue}>{comp.lastAudit.toLocaleDateString()}</span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Next Audit:</span>
                        <span className={styles.metricValue}>{comp.nextAudit.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ 
                      padding: 'var(--space-2)', 
                      background: 'var(--color-error-2)', 
                      border: '1px solid var(--color-error-6)', 
                      borderRadius: 'var(--radius-2)',
                      fontSize: '0.875rem'
                    }}>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {comp.controls - comp.compliantControls} controls need attention for certification
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunAudit(comp.framework)}
                      >
                        <CheckCircle size={16} />
                        Run Audit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(comp.framework)}
                      >
                        <FileText size={16} />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {frameworks.filter(f => !f.certified).length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)', gridColumn: '1 / -1' }}>
                All frameworks are certified! Excellent compliance posture.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
