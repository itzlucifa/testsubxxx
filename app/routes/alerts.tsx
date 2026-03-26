import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/alerts";
import { AppLayout } from "~/components/layout/app-layout";
import { CheckCircle, AlertTriangle, XCircle, Info, Bell, MessageCircle, Filter, Trash2, CheckCheck, Send, Search, Calendar, Clock, Target, Zap, Wifi, Shield } from "lucide-react";
import { useRealTimeAlerts } from "~/hooks/use-real-time-alerts";
import { useAuth } from "~/hooks/use-auth";
import { toast } from "~/hooks/use-toast";
import type { User } from "~/types";
import styles from "./alerts.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Alerts - CYBERSHIELD" },
    { name: "description", content: "Bilingual security alerts with WhatsApp integration" },
  ];
}

const alertIcons = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: CheckCircle,
};

export default function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { alerts, loading, markAsRead, scanForAlerts, scanNetwork } = useRealTimeAlerts(user?.id);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSeverity = selectedSeverity === "all" || alert.severity === selectedSeverity;
      const matchesCategory = selectedCategory === "all" || alert.category === selectedCategory;
      
      // Timeframe filtering
      const alertDate = new Date(alert.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);
      
      let matchesTimeframe = true;
      if (selectedTimeframe === "last-hour") {
        matchesTimeframe = hoursDiff <= 1;
      } else if (selectedTimeframe === "today") {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesTimeframe = alertDate.toDateString() === today.toDateString();
      } else if (selectedTimeframe === "this-week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTimeframe = alertDate >= weekAgo;
      }
      
      const title = language === "hindi" && alert.titleHindi ? alert.titleHindi : alert.title;
      const message = language === "hindi" && alert.messageHindi ? alert.messageHindi : alert.message;
      const matchesSearch = searchQuery === "" || 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSeverity && matchesCategory && matchesTimeframe && matchesSearch;
    });
  }, [alerts, selectedSeverity, selectedCategory, selectedTimeframe, searchQuery, language]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      total: alerts.length,
      unread: alerts.filter(a => !a.read).length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      whatsapp: alerts.filter(a => a.whatsappSent).length,
      lastHour: alerts.filter(a => new Date(a.timestamp) >= oneHourAgo).length,
      today: alerts.filter(a => new Date(a.timestamp) >= today).length,
    };
  }, [alerts]);

  // Get unique categories
  const categories = Array.from(new Set(alerts.map(a => a.category).filter(Boolean)));

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead(alertId);
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.read);
      for (const alert of unreadAlerts) {
        await markAsRead(alert.id);
      }
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const handleScan = async () => {
    if (!user?.id) return;
    
    // Show notification that scan is starting
    toast({
      title: "Network Scan Initiated",
      description: "Scanning network for security events...",
    });
    
    try {
      // Try to perform a network scan using the Raspberry Pi if available
      const networkScanSuccess = await scanNetwork();
      
      if (networkScanSuccess) {
        // Raspberry Pi is available, trigger a network scan
        toast({
          title: "Raspberry Pi Detected",
          description: "Scanning network using Raspberry Pi...",
        });
        
        // Trigger a network scan by making a POST request to the API
        const scanResponse = await fetch('/api/device-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            devices: [], // This triggers the Raspberry Pi to perform a fresh scan
            network_metrics: {},
            vulnerabilities: [],
            threats: [],
            alerts: [],
            timestamp: new Date().toISOString()
          })
        });
        
        if (scanResponse.ok) {
          toast({
            title: "Network Scan Complete",
            description: "Network devices and security events updated successfully",
          });
        } else {
          throw new Error(`Raspberry Pi scan failed: ${scanResponse.status}`);
        }
      } else {
        // Raspberry Pi is not available, use browser-based alert generation
        toast({
          title: "Raspberry Pi Not Available",
          description: "Generating alerts from browser data...",
        });
        
        // Use the enhanced scan function that works with browser APIs
        const success = await scanForAlerts();
        
        if (success) {
          toast({
            title: "Browser Security Scan Complete",
            description: "Security events updated from browser data",
          });
        } else {
          throw new Error("Browser scan failed");
        }
      }
    } catch (error) {
      console.error('Error during network scan:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete network scan. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading alerts...</p>
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
            <h1 className={styles.title}>Alerts & Notifications</h1>
            <p className={styles.subtitle}>
              Instant security alerts in English and Hindi with WhatsApp integration
            </p>
          </div>
          
          <div className={styles.actionButtons}>
            {stats.unread > 0 && (
              <button className={styles.markAllButton} onClick={handleMarkAllAsRead}>
                <CheckCheck size={18} />
                Mark All as Read
              </button>
            )}
            <button className={styles.scanButton} onClick={handleScan}>
              <Wifi size={18} />
              Scan Network
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Bell size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Alerts</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.unread}`}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.unread}</div>
              <div className={styles.statLabel}>Unread</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.critical}`}>
              <XCircle size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.critical}</div>
              <div className={styles.statLabel}>Critical</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.high}`}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.high}</div>
              <div className={styles.statLabel}>High</div>
            </div>
          </div>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.medium}`}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.medium}</div>
              <div className={styles.statLabel}>Medium</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.low}`}>
              <Info size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.low}</div>
              <div className={styles.statLabel}>Low</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.today}`}>
              <Calendar size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.today}</div>
              <div className={styles.statLabel}>Today</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.hour}`}>
              <Clock size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.lastHour}</div>
              <div className={styles.statLabel}>Last Hour</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.languageToggle}>
            <button
              className={`${styles.languageButton} ${language === "english" ? styles.active : ""}`}
              onClick={() => setLanguage("english")}
            >
              English
            </button>
            <button
              className={`${styles.languageButton} ${language === "hindi" ? styles.active : ""}`}
              onClick={() => setLanguage("hindi")}
            >
              हिंदी (Hindi)
            </button>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search alerts by title, message, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Time</option>
              <option value="last-hour">Last Hour</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
            </select>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Alert List */}
        {filteredAlerts.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>
              {alerts.length === 0 ? "No alerts" : "No matching alerts"}
            </h2>
            <p className={styles.emptyText}>
              {alerts.length === 0 
                ? "You're all caught up! We'll notify you when something needs your attention."
                : "Try adjusting your filters to see more alerts."}
            </p>
          </div>
        ) : (
          <div className={styles.alertList}>
            {filteredAlerts.map((alert) => {
              const Icon = alertIcons[alert.severity as keyof typeof alertIcons] || Info;
              const title = language === "hindi" && alert.titleHindi ? alert.titleHindi : alert.title;
              const message = language === "hindi" && alert.messageHindi ? alert.messageHindi : alert.message;

              return (
                <div 
                  key={alert.id} 
                  className={`${styles.alertCard} ${styles[alert.severity]} ${!alert.read ? styles.unread : ""}`}
                  onClick={() => handleMarkAsRead(alert.id)}
                >
                  <div className={styles.alertHeader}>
                    <div className={`${styles.alertIcon} ${styles[alert.severity]}`}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.alertContent}>
                      <div className={styles.alertTop}>
                        <h3 className={styles.alertTitle}>{title}</h3>
                        <span className={`${styles.severityBadge} ${styles[alert.severity]}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className={styles.alertMessage}>{message}</p>
                      
                      <div className={styles.alertFooter}>
                        <span className={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</span>
                                                
                        <div className={styles.badges}>
                          {alert.category && (
                            <span className={styles.categoryBadge}>{alert.category}</span>
                          )}
                          {alert.whatsappSent && (
                            <span className={styles.whatsappBadge}>
                              <MessageCircle size={12} />
                              WhatsApp
                            </span>
                          )}
                          {!alert.read && (
                            <span className={styles.unreadBadge}>New</span>
                          )}
                          <span className={`${styles.severityBadge} ${styles[alert.severity]}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
