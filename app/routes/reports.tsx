import { useState } from 'react';
import type { Route } from "./+types/reports";
import { AppLayout } from "~/components/layout/app-layout";
import { Button } from "~/components/ui/button/button";
import { BackButton } from "~/components/ui/back-button";
import { Download, FileText, Calendar, Shield, AlertTriangle, CheckCircle, Clock, Activity, Loader2 } from "lucide-react";
import { useRealTimeSecurityMetrics } from "~/hooks/use-real-time-security-metrics";
import { useRealTimeThreats } from "~/hooks/use-real-time-threats";
import { useRealTimeDevices } from "~/hooks/use-real-time-devices";
import { useRealTimeVulnerabilities } from "~/hooks/use-real-time-vulnerabilities";
import { useAuth } from "~/hooks/use-auth";
import { 
  generateReport, 
  downloadReport, 
  getDateRangeForReportType, 
  generateRecommendations,
  type ReportData,
  type ReportFormat,
  type ReportType
} from "~/utils/report-generator";
import { toast } from "~/hooks/use-toast";
import styles from "./reports.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Security Reports - CYBERSHIELD" },
    { name: "description", content: "Generate comprehensive security reports" },
  ];
}

export default function Reports() {
  const { user } = useAuth();
  const { metrics, loading: metricsLoading } = useRealTimeSecurityMetrics(user?.id ?? undefined);
  const { threats, loading: threatsLoading } = useRealTimeThreats(user?.id ?? undefined);
  const { devices, loading: devicesLoading } = useRealTimeDevices(user?.id ?? undefined);
  const { vulnerabilities, loading: vulnsLoading } = useRealTimeVulnerabilities(user?.id ?? undefined);

  const [generating, setGenerating] = useState<string | null>(null);
  const [customReportType, setCustomReportType] = useState('Comprehensive Security Audit');
  const [customDateRange, setCustomDateRange] = useState('Last 30 days');
  const [customFormat, setCustomFormat] = useState<ReportFormat>('pdf');

  const allLoading = metricsLoading || threatsLoading || devicesLoading || vulnsLoading;

  const buildReportData = (type: ReportType, title: string): ReportData => {
    const dateRange = getDateRangeForReportType(type);
    
    const filteredThreats = threats.filter(t => {
      const threatDate = new Date(t.timestamp);
      return threatDate >= dateRange.start && threatDate <= dateRange.end;
    });

    const filteredVulns = vulnerabilities.filter(v => {
      const vulnDate = new Date(v.discoveredAt);
      return vulnDate >= dateRange.start && vulnDate <= dateRange.end;
    });

    return {
      title,
      generatedAt: new Date(),
      dateRange,
      metrics: {
        securityScore: metrics.securityScore,
        threatsBlocked: metrics.threatsBlocked,
        vulnerabilitiesFixed: metrics.vulnerabilitiesFixed,
        devicesProtected: devices.filter(d => d.status !== 'critical').length,
        uptime: metrics.uptime,
      },
      threats: filteredThreats.map(t => ({
        id: t.id,
        type: t.type || 'Unknown',
        severity: t.severity || 'medium',
        source: t.source || 'Unknown',
        status: t.blocked ? 'blocked' : 'detected',
        detectedAt: new Date(t.timestamp).toLocaleDateString(),
        description: t.description || 'No description available',
      })),
      devices: devices.map(d => ({
        id: d.id,
        name: d.name || 'Unknown Device',
        type: d.type || 'unknown',
        status: d.status || 'unknown',
        lastScan: d.lastSeen ? new Date(d.lastSeen).toLocaleDateString() : 'Never',
        vulnerabilities: d.vulnerabilityCount || 0,
      })),
      vulnerabilities: filteredVulns.map(v => ({
        id: v.id,
        name: v.title || 'Unknown Vulnerability',
        severity: v.severity || 'medium',
        device: v.affectedDevices?.join(', ') || 'Unknown Device',
        status: v.status || 'open',
        cve: v.cveId,
      })),
      recommendations: generateRecommendations(filteredThreats, filteredVulns, devices),
    };
  };

  const handleGenerateReport = async (type: ReportType, title: string, format: ReportFormat = 'pdf') => {
    setGenerating(type);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reportData = buildReportData(type, title);
      const { content, filename, mimeType } = generateReport(reportData, format);
      
      downloadReport(content, filename, mimeType);
      
      toast({
        title: 'Report Generated',
        description: `${title} has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleCustomReport = () => {
    const typeMap: Record<string, ReportType> = {
      'Comprehensive Security Audit': 'monthly',
      'Threat Intelligence Report': 'weekly',
      'Device Security Assessment': 'devices',
      'Incident Response Summary': 'daily',
    };
    
    const reportType = typeMap[customReportType] || 'custom';
    handleGenerateReport(reportType, customReportType, customFormat);
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLive = !!user && threats.length > 0;

  if (allLoading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading reports...</p>
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
            <h1 className={styles.title}>Security Reports</h1>
            <p className={styles.subtitle}>Download comprehensive security analysis and compliance reports</p>
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
              <><strong>Live Reports:</strong> Reports generated from your real security data</>
            ) : (
              <><strong>Demo Mode:</strong> Sign in to generate reports from your actual security data</>
            )}
          </span>
        </div>

        <div className={styles.quickStats}>
          <div className={styles.statCard}>
            <Shield size={24} className={styles.statIcon} />
            <div>
              <h3 className={styles.statValue}>{metrics.threatsBlocked}</h3>
              <p className={styles.statLabel}>Threats Blocked</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <CheckCircle size={24} className={styles.statIcon} />
            <div>
              <h3 className={styles.statValue}>{metrics.vulnerabilitiesFixed}</h3>
              <p className={styles.statLabel}>Vulnerabilities Fixed</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <AlertTriangle size={24} className={styles.statIcon} />
            <div>
              <h3 className={styles.statValue}>{threats.filter((t) => t.severity === "critical").length}</h3>
              <p className={styles.statLabel}>Critical Incidents</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <Clock size={24} className={styles.statIcon} />
            <div>
              <h3 className={styles.statValue}>{metrics.uptime}%</h3>
              <p className={styles.statLabel}>System Uptime</p>
            </div>
          </div>
        </div>

        <div className={styles.reportTypes}>
          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>Daily Security Summary</h2>
                <p className={styles.reportDescription}>
                  24-hour overview of {threats.filter(t => {
                    const date = new Date(t.timestamp);
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return date >= yesterday;
                  }).length} threats detected and AI agent activity
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> {currentDate}
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('daily', 'Daily Security Summary')}
              disabled={generating !== null}
            >
              {generating === 'daily' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>Weekly Threat Analysis</h2>
                <p className={styles.reportDescription}>
                  Analysis of {threats.length} threats, attack patterns, and security trends
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> Last 7 days
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('weekly', 'Weekly Threat Analysis')}
              disabled={generating !== null}
            >
              {generating === 'weekly' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>Monthly Security Audit</h2>
                <p className={styles.reportDescription}>
                  Full security posture assessment with {vulnerabilities.length} vulnerabilities and recommendations
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> Last 30 days
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('monthly', 'Monthly Security Audit')}
              disabled={generating !== null}
            >
              {generating === 'monthly' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>Device Inventory Report</h2>
                <p className={styles.reportDescription}>
                  Complete list of {devices.length} network devices with security status
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> Real-time data
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('devices', 'Device Inventory Report')}
              disabled={generating !== null}
            >
              {generating === 'devices' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>Compliance Report</h2>
                <p className={styles.reportDescription}>
                  Security compliance status for ISO 27001, GDPR, and best practices
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> Current quarter
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('compliance', 'Compliance Report')}
              disabled={generating !== null}
            >
              {generating === 'compliance' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>

          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <FileText size={32} className={styles.reportIcon} />
              <div>
                <h2 className={styles.reportTitle}>AI Agent Performance</h2>
                <p className={styles.reportDescription}>
                  Metrics on AI detection accuracy, response times, and automation stats
                </p>
              </div>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportDate}>
                <Calendar size={16} /> Last 30 days
              </span>
              <span className={styles.reportSize}>HTML Report</span>
            </div>
            <button 
              className={styles.downloadButton} 
              onClick={() => handleGenerateReport('ai-performance', 'AI Agent Performance Report')}
              disabled={generating !== null}
            >
              {generating === 'ai-performance' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download Report
            </button>
          </div>
        </div>

        <div className={styles.customReport}>
          <h2 className={styles.sectionTitle}>Custom Report Generator</h2>
          <p className={styles.sectionDescription}>Generate a custom report with specific parameters</p>
          <div className={styles.customReportForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Report Type</label>
              <select 
                className={styles.formSelect}
                value={customReportType}
                onChange={(e) => setCustomReportType(e.target.value)}
              >
                <option>Comprehensive Security Audit</option>
                <option>Threat Intelligence Report</option>
                <option>Device Security Assessment</option>
                <option>Incident Response Summary</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date Range</label>
              <select 
                className={styles.formSelect}
                value={customDateRange}
                onChange={(e) => setCustomDateRange(e.target.value)}
              >
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Format</label>
              <select 
                className={styles.formSelect}
                value={customFormat}
                onChange={(e) => setCustomFormat(e.target.value as ReportFormat)}
              >
                <option value="pdf">HTML (Printable)</option>
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="json">JSON (Data Export)</option>
              </select>
            </div>
            <button 
              className={styles.generateButton} 
              onClick={handleCustomReport}
              disabled={generating !== null}
            >
              {generating === 'custom' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate Custom Report
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
