import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Switch } from '../components/ui/switch/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { Scale, Shield, AlertTriangle, Plus, Edit, Trash2, Activity } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimePolicies } from '../hooks/use-real-time-policies';
import styles from './common-page.module.css';

export default function Policies() {
  const { policies, loading, isDemo, togglePolicy, deletePolicy } = useRealTimePolicies();

  const handleTogglePolicy = async (id: string) => {
    const policy = policies.find(p => p.id === id);
    await togglePolicy(id);
    
    toast({
      title: policy?.enabled ? "Policy Disabled" : "Policy Enabled",
      description: policy?.name,
    });
  };

  const handleDeletePolicy = async (id: string) => {
    await deletePolicy(id);
    toast({
      title: "Policy Deleted",
      description: "Security policy has been removed",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading policies...</div>
      </div>
    );
  }

  const categories = Array.from(new Set(policies.map(p => p.category)));
  const enabledPolicies = policies.filter(p => p.enabled).length;
  const totalViolations = policies.reduce((sum, p) => sum + p.violationCount, 0);
  const criticalViolations = policies.filter(p => p.violationCount > 10).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Security Policies</h1>
          <p className={styles.subtitle}>Organizational security policy management</p>
        </div>
        <Button>
          <Plus size={18} />
          Create Policy
        </Button>
      </div>

      <div className={isDemo ? styles.demoBanner : styles.liveBanner}>
        <Activity size={16} />
        {isDemo ? (
          <span><strong>Demo Mode:</strong> Sign in to manage your actual security policies</span>
        ) : (
          <span><strong>Live:</strong> Connected to your policies in real-time</span>
        )}
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Scale size={20} />
              Total Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{policies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Shield size={20} />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{enabledPolicies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle size={20} />
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalViolations}</div>
            <div className={styles.statSubtext}>{criticalViolations} critical</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="all">All Policies</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className={styles.cardGrid}>
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <CardTitle>{policy.name}</CardTitle>
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
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Badge variant="outline">{policy.category}</Badge>
                      {policy.violationCount > 0 && (
                        <Badge variant={policy.violationCount > 10 ? 'destructive' : 'outline'}>
                          {policy.violationCount} violations
                        </Badge>
                      )}
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                      <div>Created by: {policy.createdBy}</div>
                      <div>Last updated: {policy.lastUpdated.toLocaleDateString()}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button variant="outline" size="sm">
                        <Edit size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePolicy(policy.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
            <div className={styles.cardGrid}>
              {policies.filter(p => p.category === category).map((policy) => (
                <Card key={policy.id}>
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <CardTitle>{policy.name}</CardTitle>
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
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {policy.violationCount > 0 && (
                          <Badge variant={policy.violationCount > 10 ? 'destructive' : 'outline'}>
                            {policy.violationCount} violations
                          </Badge>
                        )}
                      </div>

                      <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-11)' }}>
                        <div>Created by: {policy.createdBy}</div>
                        <div>Last updated: {policy.lastUpdated.toLocaleDateString()}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="outline" size="sm">
                          <Edit size={16} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
