import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from "./+types/devices";
import { AppLayout } from "~/components/layout/app-layout";
import { Button } from "~/components/ui/button/button";
import { Badge } from "~/components/ui/badge/badge";
import { Input } from "~/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { BackButton } from "~/components/ui/back-button";
import { deviceScanner } from "~/lib/device-scanner";
import { toast } from "sonner";
import {
  Monitor,
  Smartphone,
  Camera,
  Printer,
  Laptop,
  Tv,
  Speaker,
  HardDrive,
  Radio,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Clock,
  Activity,
} from "lucide-react";
import { useRealTimeDevices } from "~/hooks/use-real-time-devices";
import { useAuth } from "~/hooks/use-auth";
import styles from "./devices.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Device Monitor - CYBERSHIELD" },
    { name: "description", content: "Monitor all connected devices on your network" },
  ];
}

const deviceIcons: Record<string, any> = {
  router: Monitor,
  camera: Camera,
  printer: Printer,
  laptop: Laptop,
  smartphone: Smartphone,
  tablet: Smartphone,
  "smart-tv": Tv,
  "smart-speaker": Speaker,
  nas: HardDrive,
  "iot-device": Radio,
  desktop: Monitor,
  server: HardDrive,
  "smart-home": Radio,
};

type DeviceStatus = 'safe' | 'warning' | 'critical';
type DeviceType = string;

export default function Devices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { devices, loading, updateDevice } = useRealTimeDevices(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DeviceType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Register current device and start monitoring on mount
  useEffect(() => {
    const userId = user?.id || null;
    
    if (userId) {
      console.log('👤 User found:', user || 'Demo user');
      // Use enhanced scanning that checks for Raspberry Pi availability
      deviceScanner.fetchNetworkScanData(userId);
      
      // Monitor device status every 30 seconds
      const interval = setInterval(() => {
        deviceScanner.monitorDeviceStatus(userId);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      console.log('🏠 No user ID found, running in demo mode');
      // Still register current device in demo mode
      deviceScanner.fetchNetworkScanData(userId);
    }
  }, [user?.id]);

  // Filter devices based on search and filters
  const filteredDevices = devices.filter((device) => {
    const matchesSearch = 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.macAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats from real data
  const safeDevices = devices.filter((d) => d.status === "safe").length;
  const criticalDevices = devices.filter((d) => d.status === "critical").length;
  const warningDevices = devices.filter((d) => d.status === "warning").length;
  const totalVulnerabilities = devices.reduce((sum, d) => sum + (d.vulnerabilityCount || 0), 0);
  const avgRiskScore = totalVulnerabilities;

  // Get unique device types for filter
  const deviceTypes = Array.from(new Set(devices.map(d => d.type))).filter(Boolean);

  const handleRefresh = async () => {
    // Allow scan even without user (demo mode)
    const userId = user?.id || null;
    
    setIsRefreshing(true);
    setScanMessage('Scanning network for devices...');
    toast.info('Starting network scan...');
    
    try {
      console.log('🔍 Starting device scan for user:', userId);
      
      // Detect local IP addresses
      const localIPs = await deviceScanner.detectLocalIPAddresses();
      console.log('📡 Detected local IPs:', localIPs);
      
      if (localIPs.length > 0) {
        setScanMessage(`Found local IP: ${localIPs[0]}. Detecting devices...`);
        toast.success(`Found local IP: ${localIPs[0]}`);
      } else {
        setScanMessage('No local IP detected, using default...');
        toast.warning('No local IP detected, using default IP');
      }
      
      // Register current device
      console.log('📱 Registering current device...');
      await deviceScanner.registerCurrentDevice(userId);
      console.log('✅ Current device registered');
      
      // Trigger network scan (simulated for now)
      console.log('🌐 Triggering network scan...');
      const result = await deviceScanner.triggerBackendScan(userId);
      console.log('✅ Scan result:', result);
      setScanMessage(result.message);
      toast.success('Network scan completed!');
      
      // Update device status - only if user is authenticated
      if (userId) {
        console.log('🔄 Updating device status...');
        await deviceScanner.monitorDeviceStatus(userId);
        console.log('✅ Device status updated');
      }
      
      setTimeout(() => setScanMessage(''), 5000);
    } catch (error) {
      console.error('❌ Network scan error:', error);
      setScanMessage('Network scan completed with errors');
      toast.error(`Scan error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setScanMessage(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickAction = async (deviceId: string, action: 'isolate' | 'reconnect' | 'update') => {
    if (action === 'isolate') {
      await updateDevice(deviceId, { status: 'critical' as DeviceStatus });
    } else if (action === 'reconnect') {
      await updateDevice(deviceId, { status: 'safe' as DeviceStatus });
    }
    // Update action would trigger firmware update
  };

  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'safe': return <CheckCircle size={14} />;
      case 'critical': return <ShieldAlert size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const getStatusColor = (status: DeviceStatus): 'default' | 'destructive' | 'secondary' | 'outline' | undefined => {
    switch (status) {
      case 'safe': return 'default';
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskLevel = (score: number): { level: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' } => {
    if (score >= 5) return { level: 'High Risk', variant: 'destructive' };
    if (score >= 2) return { level: 'Medium Risk', variant: 'secondary' };
    return { level: 'Low Risk', variant: 'default' };
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <BackButton />
            <div>
              <h1 className={styles.title}>Device Monitor</h1>
              <p className={styles.subtitle}>
                Real-time monitoring of all connected network devices
              </p>
              {scanMessage && (
                <p className={styles.scanMessage}>
                  {scanMessage}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={styles.refreshButton}
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
            Scan Network
          </Button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Monitor size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Total Devices</p>
              <h2 className={styles.statValue}>{devices.length}</h2>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}>
              <CheckCircle size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Safe</p>
              <h2 className={`${styles.statValue} ${styles.success}`}>{safeDevices}</h2>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Warnings</p>
              <h2 className={`${styles.statValue} ${styles.warning}`}>{warningDevices}</h2>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.error}`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Critical</p>
              <h2 className={`${styles.statValue} ${styles.error}`}>{criticalDevices}</h2>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Shield size={20} />
            </div>
            <div>
              <p className={styles.statLabel}>Avg Risk Score</p>
              <h2 className={styles.statValue}>{avgRiskScore}/100</h2>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Search devices by name, IP, or MAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeviceStatus | 'all')}>
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <RefreshCw size={32} className={styles.spinning} />
            <p>Loading devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className={styles.empty}>
            <Monitor size={48} />
            <h3>No devices found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No devices detected on your network'}
            </p>
            {devices.length === 0 && (
              <Button onClick={handleRefresh}>
                <RefreshCw size={16} />
                Scan Network
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.deviceGrid}>
            {filteredDevices.map((device) => {
              const Icon = deviceIcons[device.type] || Monitor;
              const riskInfo = getRiskLevel(device.vulnerabilityCount || 0);

              return (
                <div key={device.id} className={styles.deviceCard}>
                  <div className={styles.deviceHeader}>
                    <div className={styles.deviceIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.deviceInfo}>
                      <h3 className={styles.deviceName}>{device.name}</h3>
                      <p className={styles.deviceType}>
                        {device.type?.replace('-', ' ').charAt(0).toUpperCase() + device.type?.slice(1).replace('-', ' ')}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(device.status as DeviceStatus)} className={styles.statusBadge}>
                      {getStatusIcon(device.status as DeviceStatus)}
                      {device.status}
                    </Badge>
                  </div>

                  <div className={styles.deviceDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>IP Address</span>
                      <span className={styles.detailValue}>{device.ipAddress || 'N/A'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>MAC Address</span>
                      <span className={styles.detailValue}>{device.macAddress || 'N/A'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Manufacturer</span>
                      <span className={styles.detailValue}>{device.manufacturer || 'Unknown'}</span>
                    </div>
                    {device.os && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>OS</span>
                        <span className={styles.detailValue}>{device.os}</span>
                      </div>
                    )}
                    {device.lastSeen && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          <Clock size={12} /> Last Seen
                        </span>
                        <span className={styles.detailValue}>
                          {new Date(device.lastSeen).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {device.vulnerabilityCount !== undefined && device.vulnerabilityCount > 0 && (
                    <div className={styles.riskSection}>
                      <div className={styles.riskHeader}>
                        <Shield size={14} />
                        <span className={styles.riskLabel}>Security Vulnerabilities</span>
                        <Badge variant={riskInfo.variant} className={styles.riskBadge}>
                          {riskInfo.level}
                        </Badge>
                      </div>
                      <div className={styles.riskBar}>
                        <div
                          className={`${styles.riskProgress} ${styles[riskInfo.variant === 'destructive' ? 'error' : riskInfo.variant === 'secondary' ? 'warning' : 'success']}`}
                          style={{ width: `${Math.min(device.vulnerabilityCount * 10, 100)}%` }}
                        />
                      </div>
                      <span className={styles.riskScore}>{device.vulnerabilityCount} vulnerabilities found</span>
                    </div>
                  )}

                  <div className={styles.deviceActions}>
                    {device.status === 'safe' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(device.id, 'isolate')}
                      >
                        Isolate
                      </Button>
                    )}
                    {device.status === 'critical' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(device.id, 'reconnect')}
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/devices/${device.id}`)}
                    >
                      Details
                    </Button>
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
