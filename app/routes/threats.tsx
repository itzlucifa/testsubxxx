import { useState, useMemo } from 'react';
import type { Route } from "./+types/threats";
import { AppLayout } from "~/components/layout/app-layout";
import { Shield, AlertTriangle, CheckCircle, Clock, Target, Filter, Search, RefreshCw, Zap } from "lucide-react";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { BackButton } from "~/components/ui/back-button";
import { useRealTimeThreats } from "~/hooks/use-real-time-threats";
import { useAuth } from "~/hooks/use-auth";
import { toast } from "~/hooks/use-toast";
import styles from "./threats.module.css";
import type { ThreatSeverity } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Threat Dashboard - CYBERSHIELD" },
    { name: "description", content: "AI-powered threat detection and automated response" },
  ];
}

export default function Threats() {
  const { user } = useAuth();
  const { threats, loading, addThreat, scanForThreats } = useRealTimeThreats(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showHindi, setShowHindi] = useState(false);

  // Filter threats based on search and filters
  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        threat.description.toLowerCase().includes(searchLower) ||
        threat.type.toLowerCase().includes(searchLower) ||
        threat.source.toLowerCase().includes(searchLower) ||
        threat.target.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Severity filter
      if (severityFilter !== 'all' && threat.severity !== severityFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && threat.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'blocked' && !threat.blocked) return false;
      if (statusFilter === 'active' && threat.blocked) return false;
      if (statusFilter === 'auto-remediated' && !threat.autoRemediated) return false;

      return true;
    });
  }, [threats, searchQuery, severityFilter, typeFilter, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = threats.length;
    const blocked = threats.filter(t => t.blocked).length;
    const autoRemediated = threats.filter(t => t.autoRemediated).length;
    const critical = threats.filter(t => t.severity === 'critical').length;
    
    return { total, blocked, autoRemediated, critical };
  }, [threats]);

  // Get unique threat types
  const threatTypes = useMemo(() => {
    const types = new Set(threats.map(t => t.type));
    return Array.from(types);
  }, [threats]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefresh = async () => {
    // The real-time hook automatically refreshes, but we can trigger a manual refresh
    window.location.reload();
  };

  const handleScan = async () => {
    if (!user?.id) return;
    
    toast({
      title: "Scanning for Threats",
      description: "Initiating real-time threat detection...",
    });

    const success = await scanForThreats();
    
    if (success) {
      toast({
        title: "Scan Completed",
        description: "Threat detection completed successfully",
      });
    } else {
      toast({
        title: "Scan Failed",
        description: "Unable to complete threat scan. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSeverityIcon = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={16} />;
      case 'high':
        return <AlertTriangle size={16} />;
      case 'medium':
        return <Shield size={16} />;
      case 'low':
        return <CheckCircle size={16} />;
      default:
        return <Shield size={16} />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <RefreshCw className={styles.spinner} size={32} />
            <p>Loading threats...</p>
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
            <h1 className={styles.title}>Threat Dashboard</h1>
            <p className={styles.subtitle}>
              AI swarm-powered threat detection with automatic remediation
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHindi(!showHindi)}
            >
              {showHindi ? 'English' : 'हिंदी'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScan}
            >
              <Zap size={16} />
              Scan for Threats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={styles.overview}>
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <p className={styles.overviewLabel}>Total Threats</p>
              <div className={`${styles.overviewIcon} ${styles.detected}`}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <h2 className={styles.overviewValue}>{stats.total}</h2>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <p className={styles.overviewLabel}>Threats Blocked</p>
              <div className={`${styles.overviewIcon} ${styles.blocked}`}>
                <Shield size={20} />
              </div>
            </div>
            <h2 className={styles.overviewValue}>{stats.blocked}</h2>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <p className={styles.overviewLabel}>Auto-Remediated</p>
              <div className={`${styles.overviewIcon} ${styles.prevented}`}>
                <CheckCircle size={20} />
              </div>
            </div>
            <h2 className={styles.overviewValue}>{stats.autoRemediated}</h2>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <p className={styles.overviewLabel}>Critical Threats</p>
              <div className={`${styles.overviewIcon} ${styles.critical}`}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <h2 className={styles.overviewValue}>{stats.critical}</h2>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Search threats by description, type, source, or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {threatTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace('-', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="auto-remediated">Auto-Remediated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Threat List */}
        {filteredThreats.length === 0 ? (
          <div className={styles.empty}>
            <Shield size={48} />
            <h3>No Threats Found</h3>
            <p>
              {searchQuery || severityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your network is secure'}
            </p>
          </div>
        ) : (
          <div className={styles.threatList}>
            {filteredThreats.map((threat) => (
              <div key={threat.id} className={styles.threatCard}>
                <div className={styles.threatHeader}>
                  <div className={styles.threatInfo}>
                    <div className={styles.threatTitleRow}>
                      {getSeverityIcon(threat.severity)}
                      <h3 className={styles.threatTitle}>
                        {showHindi && threat.descriptionHindi ? threat.descriptionHindi : threat.description}
                      </h3>
                    </div>
                    <div className={styles.threatMeta}>
                      <span className={`${styles.threatBadge} ${styles[threat.severity]}`}>
                        {threat.severity}
                      </span>
                      <span className={`${styles.threatBadge} ${threat.blocked ? styles.blocked : styles.active}`}>
                        {threat.blocked ? 'Blocked' : 'Active'}
                      </span>
                      {threat.autoRemediated && (
                        <span className={`${styles.threatBadge} ${styles.autoRemediated}`}>
                          Auto-Remediated
                        </span>
                      )}
                      <span className={styles.confidenceScore}>
                        <Target size={12} />
                        {threat.confidence}% confidence
                      </span>
                      <span className={styles.threatTime}>
                        <Clock size={14} />
                        {formatTimeAgo(threat.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.threatDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Threat Type</span>
                    <span className={styles.detailValue}>{threat.type.replace("-", " ").toUpperCase()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Source</span>
                    <span className={styles.detailValue}>{threat.source}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Target</span>
                    <span className={styles.detailValue}>{threat.target}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Detection Time</span>
                    <span className={styles.detailValue}>{threat.timestamp.toLocaleString()}</span>
                  </div>
                </div>

                {threat.autoRemediated && (
                  <div className={styles.autoRemediatedBadge}>
                    <CheckCircle size={14} />
                    <span>Automatically Remediated by AI Swarm</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
