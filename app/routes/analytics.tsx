import type { Route } from "./+types/analytics";
import { AppLayout } from "~/components/layout/app-layout";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Shield, Activity, Clock, Target, Zap, AlertTriangle } from "lucide-react";
import { BackButton } from "~/components/ui/back-button";
import { useRealTimeAnalytics } from "~/hooks/use-real-time-analytics";
import { useAuth } from "~/hooks/use-auth";
import styles from "./analytics.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Security Analytics - CYBERSHIELD" },
    { name: "description", content: "Deep security analytics and performance metrics" },
  ];
}

export default function Analytics() {
  const { user } = useAuth();
  const { 
    threatsByType, 
    weeklyActivity, 
    monthlyTrend, 
    responseTime, 
    kpis,
    loading,
    isLive 
  } = useRealTimeAnalytics();

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <BackButton />
            <h1 className={styles.title}>Security Analytics</h1>
            <p className={styles.subtitle}>Deep insights into CYBERSHIELD performance and threat landscape</p>
          </div>
        </div>

        <div style={{ 
          padding: 'var(--space-3)', 
          background: isLive ? 'var(--color-accent-2)' : 'var(--color-warning-2)', 
          border: `1px solid ${isLive ? 'var(--color-accent-6)' : 'var(--color-warning-6)'}`,
          borderRadius: 'var(--radius-2)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <Activity size={18} />
          <span>
            {isLive ? (
              <><strong>Live Analytics:</strong> Real-time data from your security infrastructure</>
            ) : (
              <><strong>Demo Mode:</strong> Sign in to view analytics from your actual security data</>
            )}
          </span>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{kpis.totalThreatsBlocked}</h3>
              <p className={styles.kpiLabel}>Threats Blocked</p>
              <span className={styles.kpiTrend}>
                <TrendingUp size={14} /> This period
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Zap size={24} />
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{kpis.totalAlertsResolved}</h3>
              <p className={styles.kpiLabel}>Alerts Resolved</p>
              <span className={styles.kpiTrend}>
                <TrendingUp size={14} /> Automated response
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Activity size={24} />
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{kpis.detectionAccuracy.toFixed(1)}%</h3>
              <p className={styles.kpiLabel}>Detection Accuracy</p>
              <span className={styles.kpiTrend}>
                <Target size={14} /> AI-powered
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Clock size={24} />
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{kpis.avgResponseTime}ms</h3>
              <p className={styles.kpiLabel}>Avg Response Time</p>
              <span className={styles.kpiTrend}>
                <TrendingUp size={14} /> Real-time detection
              </span>
            </div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Threats by Type</h2>
            <p className={styles.chartSubtitle}>Distribution of detected threat categories</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatsByType as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Weekly Threat Activity</h2>
            <p className={styles.chartSubtitle}>Threats detected vs blocked this week</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="threats" fill="#f97316" name="Threats Detected" />
                <Bar dataKey="blocked" fill="#10b981" name="Blocked" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Security Score Trend</h2>
            <p className={styles.chartSubtitle}>6-month security posture improvement</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Line type="monotone" dataKey="score" stroke="#00d4ff" strokeWidth={3} name="Security Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Response Time</h2>
            <p className={styles.chartSubtitle}>CYBERSHIELD threat detection speed (24h)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Line type="monotone" dataKey="ms" stroke="#8b5cf6" strokeWidth={2} name="Response (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.performanceSection}>
          <h2 className={styles.sectionTitle}>AI Agent Performance</h2>
          <div className={styles.performanceGrid}>
            <div className={styles.performanceCard}>
              <h3 className={styles.performanceLabel}>Detection Accuracy</h3>
              <div className={styles.performanceBar}>
                <div className={styles.performanceProgress} style={{ width: `${kpis.detectionAccuracy}%` }}>
                  {kpis.detectionAccuracy.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className={styles.performanceCard}>
              <h3 className={styles.performanceLabel}>Remediation Success</h3>
              <div className={styles.performanceBar}>
                <div className={styles.performanceProgress} style={{ width: `${kpis.remediationSuccess}%` }}>
                  {kpis.remediationSuccess.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className={styles.performanceCard}>
              <h3 className={styles.performanceLabel}>Threat Response Rate</h3>
              <div className={styles.performanceBar}>
                <div className={styles.performanceProgress} style={{ width: "98.2%" }}>
                  98.2%
                </div>
              </div>
            </div>

            <div className={styles.performanceCard}>
              <h3 className={styles.performanceLabel}>False Positive Rate</h3>
              <div className={styles.performanceBar}>
                <div className={styles.performanceProgress} style={{ width: `${kpis.falsePositiveRate}%`, backgroundColor: "#10b981" }}>
                  {kpis.falsePositiveRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
