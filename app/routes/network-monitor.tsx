import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Progress } from '../components/ui/progress/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { Button } from '../components/ui/button/button';
import { BackButton } from '../components/ui/back-button';
import { Activity, Wifi, TrendingDown, TrendingUp, Radio, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useRealTimeNetwork } from '../hooks/use-real-time-network';
import { networkMonitor } from '../lib/network-monitor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from '../hooks/use-toast';
import styles from './network-monitor.module.css';

const bandwidthData = [
  { time: '00:00', download: 180, upload: 75 },
  { time: '04:00', download: 120, upload: 45 },
  { time: '08:00', download: 245, upload: 98 },
  { time: '12:00', download: 280, upload: 110 },
  { time: '16:00', download: 320, upload: 125 },
  { time: '20:00', download: 290, upload: 105 },
  { time: '23:59', download: 245, upload: 98 },
];

const latencyData = [
  { time: '00:00', latency: 15 },
  { time: '04:00', latency: 10 },
  { time: '08:00', latency: 12 },
  { time: '12:00', latency: 18 },
  { time: '16:00', latency: 14 },
  { time: '20:00', latency: 11 },
  { time: '23:59', latency: 12 },
];

export default function NetworkMonitor() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bandwidthHistory, setBandwidthHistory] = useState<Array<{ time: string; download: number; upload: number }>>([]);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; latency: number }>>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const { metrics, events, loading, refresh } = useRealTimeNetwork(currentUser?.id || '');

  // Update bandwidth history
  useEffect(() => {
    if (metrics.bandwidth.download > 0) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setBandwidthHistory(prev => {
        const newData = [...prev, {
          time: timeStr,
          download: Math.round(metrics.bandwidth.download),
          upload: Math.round(metrics.bandwidth.upload)
        }];
        return newData.slice(-20); // Keep last 20 data points
      });

      setLatencyHistory(prev => {
        const newData = [...prev, {
          time: timeStr,
          latency: Math.round(metrics.latency)
        }];
        return newData.slice(-20);
      });
    }
  }, [metrics]);

  // Initialize network monitoring on mount
  useEffect(() => {
    if (!currentUser?.id) return;

    // Seed demo events if database is empty
    networkMonitor.seedDemoEvents(currentUser.id);

    // Start real-time monitoring and store cleanup
    let cleanup: (() => void) | undefined;
    networkMonitor.startMonitoring(currentUser.id).then((fn) => {
      cleanup = fn;
    });

    // Perform initial network analysis
    networkMonitor.analyzeNetwork(currentUser.id);

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentUser?.id]);

  const handleRefresh = async () => {
    if (!currentUser?.id) return;

    // Show loading toast
    toast({
      title: "Refreshing Network Data",
      description: "Analyzing network status and testing connectivity...",
    });

    try {
      // Perform comprehensive network analysis
      await networkMonitor.analyzeNetwork(currentUser.id);
      
      // Test connectivity to external services
      await networkMonitor.checkConnectivity(currentUser.id);
      
      // Refresh the React hook data
      refresh();
      
      // Clear and reset history for fresh data
      setBandwidthHistory([]);
      setLatencyHistory([]);
      
      // Show success message
      toast({
        title: "Network Data Refreshed",
        description: `Latest network metrics and events loaded successfully at ${new Date().toLocaleTimeString()}.`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh network data. Please try again.",
      });
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'fair':
        return 'outline';
      case 'poor':
        return 'destructive';
      default:
        return 'secondary';
    }
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Network Monitor</h1>
          <p className={styles.subtitle}>Real-time network performance using browser Network Information API</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <Badge variant={navigator.onLine ? 'default' : 'destructive'}>
              {navigator.onLine ? <><CheckCircle size={12} /> Online</> : <><AlertCircle size={12} /> Offline</>}
            </Badge>
            <span style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-neutral-11)' }}>
              {events.length > 0 && `${events.length} events tracked`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Badge variant={getQualityColor(metrics.connectionQuality)}>
            {loading ? 'LOADING...' : metrics.connectionQuality.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.metricTitle}>
              <TrendingDown size={20} />
              Download Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>
              {metrics.bandwidth.download === 0 ? '-- ' : Math.round(metrics.bandwidth.download)} 
              Mbps
            </div>
            <div className={styles.metricSubtext}>
              {metrics.bandwidth.download === 0 ? 'Measuring...' : 'Real-time speed'}
            </div>
            <Progress value={(metrics.bandwidth.download / 500) * 100} className={styles.progress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.metricTitle}>
              <TrendingUp size={20} />
              Upload Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>
              {metrics.bandwidth.upload === 0 ? '-- ' : Math.round(metrics.bandwidth.upload)} 
              Mbps
            </div>
            <div className={styles.metricSubtext}>
              {metrics.bandwidth.upload === 0 ? 'Measuring...' : 'Real-time speed'}
            </div>
            <Progress value={(metrics.bandwidth.upload / 200) * 100} className={styles.progress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.metricTitle}>
              <Activity size={20} />
              Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>
              {metrics.latency === 0 ? '-- ' : Math.round(metrics.latency)} 
              ms
            </div>
            <div className={styles.metricSubtext}>
              {metrics.latency === 0 ? 'Measuring...' : metrics.latency < 20 ? 'Excellent response' : metrics.latency < 100 ? 'Good response' : 'High latency'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.metricTitle}>
              <Radio size={20} />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>{metrics.activeConnections}</div>
            <div className={styles.metricSubtext}>Across all devices</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="bandwidth" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="bandwidth">Bandwidth Usage</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          <TabsTrigger value="events">Network Events</TabsTrigger>
        </TabsList>

        <TabsContent value="bandwidth">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Bandwidth Usage</CardTitle>
              <CardDescription>Download and upload speeds over the past day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={bandwidthHistory.length > 0 ? bandwidthHistory : [{ time: 'Loading...', download: 0, upload: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
                  <XAxis dataKey="time" stroke="var(--color-neutral-11)" />
                  <YAxis stroke="var(--color-neutral-11)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-neutral-2)',
                      border: '1px solid var(--color-neutral-6)',
                      borderRadius: 'var(--radius-2)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="download"
                    stroke="var(--color-accent-9)"
                    fill="var(--color-accent-3)"
                    name="Download (Mbps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="upload"
                    stroke="var(--color-success-9)"
                    fill="var(--color-success-3)"
                    name="Upload (Mbps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="latency">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Latency</CardTitle>
              <CardDescription>Network response time over the past day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyHistory.length > 0 ? latencyHistory : [{ time: 'Loading...', latency: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
                  <XAxis dataKey="time" stroke="var(--color-neutral-11)" />
                  <YAxis stroke="var(--color-neutral-11)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-neutral-2)',
                      border: '1px solid var(--color-neutral-6)',
                      borderRadius: 'var(--radius-2)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="var(--color-accent-9)"
                    strokeWidth={2}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Network Events Timeline</CardTitle>
              <CardDescription>Recent network activity and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.eventsList}>
                {events.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-neutral-11)' }}>No network events yet. Events will appear here in real-time.</div>}
                {events.map((event) => (
                  <div key={event.id} className={styles.event}>
                    <div className={styles.eventIcon}>
                      {event.type === 'alert' && <AlertCircle size={20} className={styles.alertIcon} />}
                      {event.type === 'connection' && <Wifi size={20} className={styles.infoIcon} />}
                      {event.type === 'anomaly' && <Activity size={20} className={styles.warningIcon} />}
                    </div>
                    <div className={styles.eventContent}>
                      <div className={styles.eventDescription}>{event.description}</div>
                      <div className={styles.eventTime}>
                        {event.timestamp.toLocaleTimeString()} - {event.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={getSeverityColor(event.severity)}>{event.severity.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className={styles.additionalMetrics}>
        <Card>
          <CardHeader>
            <CardTitle>Packet Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>{metrics.packetLoss.toFixed(2)}%</div>
            <Progress value={metrics.packetLoss * 20} className={styles.progress} />
            <div className={styles.metricSubtext}>Minimal packet loss detected</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.qualityBadge}>
              <Badge variant={getQualityColor(metrics.connectionQuality)} className={styles.largeBadge}>
                {metrics.connectionQuality.toUpperCase()}
              </Badge>
            </div>
            <div className={styles.qualityDetails}>
              <div className={styles.qualityItem}>
                <span>Latency:</span>
                <span className={styles.qualityValue}>Excellent</span>
              </div>
              <div className={styles.qualityItem}>
                <span>Stability:</span>
                <span className={styles.qualityValue}>Very Good</span>
              </div>
              <div className={styles.qualityItem}>
                <span>Throughput:</span>
                <span className={styles.qualityValue}>High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
