import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Input } from '../components/ui/input/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { 
  FileSearch, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Search,
  Shield,
  HardDrive,
  Database,
  Activity,
  Hash,
  Globe,
  Server,
  Mail,
  Loader2
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeForensics, type ForensicEvidence } from '../hooks/use-real-time-forensics';
import { useAuth } from '../hooks/use-auth';
import styles from './common-page.module.css';

export default function Forensics() {
  const { user } = useAuth();
  const {
    cases,
    loading,
    analyzing,
    stats,
    createCase,
    addEvidence,
    closeCase,
  } = useRealTimeForensics();

  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [evidenceValue, setEvidenceValue] = useState('');
  const [evidenceType, setEvidenceType] = useState<ForensicEvidence['type']>('ip_address');

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a case title',
        variant: 'destructive',
      });
      return;
    }

    await createCase(newCaseTitle, '', 'medium');
    setNewCaseTitle('');
    toast({
      title: 'Case Created',
      description: 'New forensic investigation case opened',
    });
  };

  const handleAddEvidence = async () => {
    if (!selectedCase || !evidenceValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a case and enter evidence',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Analyzing Evidence',
      description: 'Running threat intelligence checks...',
    });

    const result = await addEvidence(selectedCase, evidenceType, evidenceValue);
    setEvidenceValue('');

    if (result.analysisResult) {
      toast({
        title: `Analysis Complete: ${result.analysisResult.verdict.toUpperCase()}`,
        description: result.analysisResult.details,
        variant: result.analysisResult.verdict === 'malicious' ? 'destructive' : 'default',
      });
    }
  };

  const handleCloseCase = async (caseId: string) => {
    await closeCase(caseId, 'Investigation completed');
    toast({
      title: 'Case Closed',
      description: 'Investigation archived',
    });
  };

  const getEvidenceIcon = (type: ForensicEvidence['type']) => {
    switch (type) {
      case 'file_hash': return Hash;
      case 'ip_address': return Server;
      case 'url': return Globe;
      case 'domain': return Globe;
      case 'email': return Mail;
      default: return Database;
    }
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'malicious': return 'destructive';
      case 'suspicious': return 'outline';
      case 'clean': return 'default';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const openCases = cases.filter(c => c.status !== 'closed');
  const closedCases = cases.filter(c => c.status === 'closed');
  const selectedCaseData = cases.find(c => c.id === selectedCase);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BackButton />
          <h1 className={styles.title}>Digital Forensics</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Digital Forensics</h1>
          <p className={styles.subtitle}>Investigate security incidents with real threat intelligence</p>
        </div>
      </div>

      <div style={{ 
        padding: 'var(--space-3)', 
        background: user ? 'var(--color-accent-2)' : 'var(--color-warning-2)', 
        border: `1px solid ${user ? 'var(--color-accent-6)' : 'var(--color-warning-6)'}`,
        borderRadius: 'var(--radius-2)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        <Activity size={18} />
        <span>
          {user ? (
            <><strong>Live Analysis:</strong> Evidence is analyzed using VirusTotal, AbuseIPDB, and AlienVault OTX APIs</>
          ) : (
            <><strong>Demo Mode:</strong> Sign in to save cases and run live threat intelligence analysis</>
          )}
        </span>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <FileSearch size={20} />
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.activeCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle size={20} />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.criticalCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Database size={20} />
              Evidence Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.totalEvidence}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Shield size={20} />
              Malicious Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.maliciousFindings}</div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Input
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                placeholder="Case title..."
                style={{ flex: 1 }}
              />
              <Button onClick={handleCreateCase}>
                <Plus size={16} />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <select
                value={selectedCase || ''}
                onChange={(e) => setSelectedCase(e.target.value)}
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-2)',
                  border: '1px solid var(--color-neutral-6)',
                  background: 'var(--color-neutral-1)',
                  color: 'var(--color-neutral-12)',
                }}
              >
                <option value="">Select case...</option>
                {openCases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as ForensicEvidence['type'])}
                  style={{
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--color-neutral-6)',
                    background: 'var(--color-neutral-1)',
                    color: 'var(--color-neutral-12)',
                  }}
                >
                  <option value="ip_address">IP Address</option>
                  <option value="file_hash">File Hash</option>
                  <option value="url">URL</option>
                  <option value="domain">Domain</option>
                </select>
                <Input
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  placeholder={evidenceType === 'ip_address' ? '192.168.1.1' : evidenceType === 'file_hash' ? 'MD5/SHA256 hash' : 'Enter value...'}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleAddEvidence} disabled={analyzing !== null}>
                  {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  Analyze
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="active">Active Cases ({openCases.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedCases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className={styles.cardGrid}>
            {openCases.map((forensicCase) => (
              <Card key={forensicCase.id}>
                <CardHeader>
                  <CardTitle>{forensicCase.title}</CardTitle>
                  <CardDescription>
                    Investigator: {forensicCase.investigator}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Badge variant={getPriorityColor(forensicCase.priority)}>
                        {forensicCase.priority.toUpperCase()}
                      </Badge>
                      <Badge variant={forensicCase.status === 'investigating' ? 'default' : 'outline'}>
                        {forensicCase.status}
                      </Badge>
                      <Badge variant="secondary">
                        <Database size={14} />
                        {forensicCase.evidence.length} evidence
                      </Badge>
                    </div>

                    {forensicCase.evidence.length > 0 && (
                      <div style={{ 
                        padding: 'var(--space-2)', 
                        background: 'var(--color-neutral-2)',
                        borderRadius: 'var(--radius-2)',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Evidence:</div>
                        {forensicCase.evidence.slice(0, 3).map(ev => {
                          const Icon = getEvidenceIcon(ev.type);
                          return (
                            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                              <Icon size={14} />
                              <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem' }}>{ev.value.substring(0, 30)}...</span>
                              {ev.analysisResult && (
                                <Badge variant={getVerdictColor(ev.analysisResult.verdict)} style={{ fontSize: '0.7rem' }}>
                                  {ev.analysisResult.verdict}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {forensicCase.findings.length > 0 && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Findings:</div>
                        <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                          {forensicCase.findings.slice(0, 3).map((finding, idx) => (
                            <li key={idx}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCase(forensicCase.id)}
                      >
                        <Plus size={14} />
                        Add Evidence
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCloseCase(forensicCase.id)}
                      >
                        <CheckCircle size={14} />
                        Close Case
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {openCases.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)', gridColumn: '1 / -1' }}>
                No active cases. Create a new investigation to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed">
          <div className={styles.cardGrid}>
            {closedCases.map((forensicCase) => (
              <Card key={forensicCase.id}>
                <CardHeader>
                  <CardTitle>{forensicCase.title}</CardTitle>
                  <CardDescription>
                    Closed: {forensicCase.closedAt?.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Badge variant="secondary">
                        <CheckCircle size={14} />
                        Closed
                      </Badge>
                      <Badge variant="secondary">
                        {forensicCase.evidence.length} evidence items
                      </Badge>
                    </div>
                    {forensicCase.findings.length > 0 && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Resolution:</div>
                        <p>{forensicCase.findings[forensicCase.findings.length - 1]}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
