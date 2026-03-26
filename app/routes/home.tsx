import type { Route } from "./+types/home";
import { AppLayout } from "~/components/layout/app-layout";
import { Shield, HelpCircle, AlertTriangle, TrendingUp, Activity, Zap, Info, CheckCircle } from "lucide-react";
import type { DeviceStatus } from "~/types";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/hooks/use-auth";
import { useRealTimeDevices } from "~/hooks/use-real-time-devices";
import { useRealTimeThreats } from "~/hooks/use-real-time-threats";
import { useRealTimeAlerts } from "~/hooks/use-real-time-alerts";
import { useRealTimeVulnerabilities } from "~/hooks/use-real-time-vulnerabilities";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CYBERSHIELD - Autonomous Cybersecurity" },
    {
      name: "description",
      content: "Autonomous AI-powered cybersecurity protection for homes and small businesses",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch real-time data from Supabase
  const { devices, loading: devicesLoading } = useRealTimeDevices(user?.id);
  const { threats, loading: threatsLoading } = useRealTimeThreats(user?.id);
  const { alerts, loading: alertsLoading } = useRealTimeAlerts(user?.id);
  const { vulnerabilities, loading: vulnsLoading } = useRealTimeVulnerabilities(user?.id || '');

  // Calculate comprehensive security status based on multiple factors
  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const highThreats = threats.filter(t => t.severity === 'high').length;
  const mediumThreats = threats.filter(t => t.severity === 'medium').length;
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
  const totalVulns = vulnerabilities.length;
  
  // Calculate risk score based on multiple factors
  const threatRisk = (criticalThreats * 10) + (highThreats * 5) + (mediumThreats * 2);
  const vulnerabilityRisk = (criticalVulns * 8) + (highVulns * 4);
  const alertRisk = unreadAlerts * 1; // Lower weight for alerts
  
  // Total risk score (higher is worse)
  const totalRiskScore = threatRisk + vulnerabilityRisk + alertRisk;
  
  // Determine security status based on risk score
  const isSafe = totalRiskScore < 10; // Threshold for 'safe'
  const isWarning = totalRiskScore >= 10 && totalRiskScore < 25; // Threshold for 'warning'
  const isCritical = totalRiskScore >= 25; // Threshold for 'critical'
  
  // Calculate status text and message
  let statusText = 'Safe';
  let statusMessage = 'Your network is secure';
  
  if (isCritical) {
    statusText = 'Critical';
    statusMessage = `${criticalThreats + criticalVulns} critical issues detected`;
  } else if (isWarning) {
    statusText = 'At Risk';
    statusMessage = `${totalVulns} vulnerabilities and ${threats.length} threats detected`;
  } else if (!isSafe) {
    statusText = 'At Risk';
    statusMessage = `${totalVulns} vulnerabilities and ${threats.length} threats detected`;
  } else {
    statusMessage = 'Your network is secure';
  }

  // Get recent alerts for timeline
  const recentAlerts = alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Device stats (safe = online, warning = degraded, critical = offline)
  const onlineDevices = devices.filter(d => d.status === 'safe').length;
  const totalDevices = devices.length;

  // Calculate monthly threat trend
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthThreats = threats.filter(t => {
      const threatDate = new Date(t.timestamp);
      return threatDate.getMonth() === month.getMonth() && 
             threatDate.getFullYear() === month.getFullYear();
    }).length;
    
    return {
      day: month.toLocaleDateString('en-US', { month: 'short' }),
      height: Math.min((monthThreats / Math.max(threats.length / 6, 1)) * 100, 100),
      count: monthThreats
    };
  });

  return (
    <AppLayout>
      <div className={styles.container}>
        <button 
          className={styles.settingsButton}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>

        <div className={styles.topSection}>
          <div className={`${styles.statusCard} ${isCritical ? styles.statusCardCritical : isWarning ? styles.statusCardWarning : ''}`}>
            <div className={styles.statusIcon}>
              {isSafe ? (
                <Shield size={48} className={styles.statusShield} />
              ) : isCritical ? (
                <AlertTriangle size={48} className={styles.statusCritical} />
              ) : (
                <AlertTriangle size={48} className={styles.statusWarning} />
              )}
            </div>
            <h2 className={styles.statusLabel}>{statusText}</h2>
            <p className={styles.statusMessage}>{statusMessage}</p>
            {!isSafe && (
              <Link to="/threats" className={styles.viewThreatsLink}>
                View Threats
              </Link>
            )}
          </div>

          <Link to="/help" className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              <HelpCircle size={24} />
            </div>
            <h3 className={styles.infoCardTitle}>Security FAQs</h3>
            <p className={styles.infoCardSubtitle}>Get answers</p>
          </Link>

          <Link to="/ai-assistant" className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              <Zap size={24} />
            </div>
            <h3 className={styles.infoCardTitle}>AI Assistant</h3>
            <p className={styles.infoCardSubtitle}>Get help now</p>
          </Link>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Activity size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{onlineDevices}/{totalDevices}</div>
              <div className={styles.statLabel}>Devices Online</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{threats.length}</div>
              <div className={styles.statLabel}>Active Threats</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Info size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{unreadAlerts}</div>
              <div className={styles.statLabel}>Unread Alerts</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Shield size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{vulnerabilities.length}</div>
              <div className={styles.statLabel}>Vulnerabilities</div>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.devicesSection}>
            <h2 className={styles.sectionTitle}>Connected Devices</h2>

            {devicesLoading ? (
              <div className={styles.loadingState}>Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No devices found</p>
                <Link to="/devices" className={styles.addDeviceLink}>
                  Add Device
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.deviceList}>
                  {devices.slice(0, 5).map((device) => {
                    const getDeviceIcon = (type: string) => {
                      const icons: Record<string, string> = {
                        computer: '💻',
                        phone: '📱',
                        router: '📡',
                        iot: '🏠',
                        camera: '📹',
                        printer: '🖨️',
                        tv: '📺',
                        speaker: '🔊',
                        nas: '💾'
                      };
                      return icons[type] || '💻';
                    };
                    
                    const getStatusText = (status: DeviceStatus) => {
                      const statusMap: Record<DeviceStatus, string> = {
                        safe: 'Online',
                        warning: 'Warning',
                        critical: 'Critical'
                      };
                      return statusMap[status];
                    };
                    
                    return (
                      <div key={device.id} className={styles.deviceItem}>
                        <div className={styles.deviceAvatar}>
                          {getDeviceIcon(device.type)}
                        </div>
                        <div className={styles.deviceInfo}>
                          <h3 className={styles.deviceName}>{device.name}</h3>
                          <p className={styles.deviceAction}>
                            {device.ipAddress} • {device.type}
                          </p>
                        </div>
                        <span 
                          className={`${styles.deviceStatus} ${styles[device.status]}`}
                        >
                          {getStatusText(device.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button 
                  className={styles.viewButton}
                  onClick={() => navigate('/devices')}
                >
                  View All Devices ({totalDevices})
                </button>
              </>
            )}
          </div>

          <div className={styles.calendarSection}>
            <div className={styles.alertsHeader}>
              <h2 className={styles.calendarTitle}>Recent Activity</h2>
              <Link to="/alerts" className={styles.viewAllLink}>
                View All
              </Link>
            </div>

            <div className={styles.checksSection}>
              {alertsLoading ? (
                <div className={styles.loadingState}>Loading alerts...</div>
              ) : recentAlerts.length === 0 ? (
                <div className={styles.emptyState}>
                  <CheckCircle size={32} />
                  <p>No recent alerts</p>
                  <p className={styles.emptySubtext}>Your system is running smoothly</p>
                </div>
              ) : (
                <div className={styles.checksList}>
                  {recentAlerts.map((alert) => {
                    const alertDate = new Date(alert.timestamp);
                    return (
                      <div 
                        key={alert.id} 
                        className={`${styles.checkItem} ${!alert.read ? styles.unread : ''}`}
                        onClick={() => navigate('/alerts')}
                      >
                        <div className={styles.checkDate}>
                          <span className={styles.checkDateDay}>
                            {alertDate.getDate().toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className={styles.checkInfo}>
                          <h4 className={styles.checkName}>{alert.title}</h4>
                          <p className={styles.checkDescription}>{alert.message}</p>
                        </div>
                        <div className={styles.checkTime}>
                          <span className={`${styles.severityBadge} ${styles[alert.severity]}`}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button 
                className={styles.viewFullButton}
                onClick={() => navigate('/alerts')}
              >
                View All Alerts
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statusSection}>
          <div className={styles.chartHeader}>
            <h2 className={styles.sectionTitle}>Threat Activity (Last 6 Months)</h2>
            <Link to="/analytics" className={styles.viewAnalyticsLink}>
              <TrendingUp size={16} />
              View Analytics
            </Link>
          </div>
          <div className={styles.chartContainer}>
            <div className={styles.chartWrapper}>
              <div className={styles.chartYAxis}>
                <div>High</div>
                <div>Med</div>
                <div>Low</div>
              </div>
              <div className={styles.chartContent}>
                {monthlyData.map((item) => (
                  <div key={item.day} className={styles.chartColumn}>
                    <div 
                      className={styles.chartBar} 
                      style={{ height: `${Math.max(item.height, 10)}%` }}
                      title={`${item.count} threats in ${item.day}`}
                    />
                    <div className={styles.chartLabel}>{item.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
