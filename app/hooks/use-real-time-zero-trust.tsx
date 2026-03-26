import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';
import { useRealTimeDevices } from './use-real-time-devices';
import { useRealTimeThreats } from './use-real-time-threats';
import { useRealTimeAlerts } from './use-real-time-alerts';
import type { Threat, Alert } from '../types';

const demoThreats: Threat[] = [
  {
    id: 'demo-threat-1',
    type: 'malware',
    severity: 'high',
    source: '192.168.1.105',
    target: 'Network Gateway',
    timestamp: new Date(Date.now() - 3600000),
    blocked: true,
    autoRemediated: true,
    confidence: 95,
    description: 'Suspicious outbound connection blocked',
  },
  {
    id: 'demo-threat-2',
    type: 'port-scan',
    severity: 'medium',
    source: '203.0.113.50',
    target: 'Router',
    timestamp: new Date(Date.now() - 7200000),
    blocked: true,
    autoRemediated: false,
    confidence: 87,
    description: 'Port scan attempt detected and blocked',
  },
  {
    id: 'demo-threat-3',
    type: 'phishing',
    severity: 'low',
    source: 'email',
    target: 'User Device',
    timestamp: new Date(Date.now() - 86400000),
    blocked: true,
    autoRemediated: true,
    confidence: 92,
    description: 'Phishing email detected and quarantined',
  },
];

const demoAlerts: Alert[] = [
  {
    id: 'demo-alert-1',
    title: 'Device Security Update Available',
    message: 'Smartphone requires firmware update for security patches',
    severity: 'medium',
    timestamp: new Date(Date.now() - 1800000),
    read: false,
    whatsappSent: false,
    category: 'security',
  },
  {
    id: 'demo-alert-2',
    title: 'Weak Password Detected',
    message: 'Network Printer is using a weak default password',
    severity: 'high',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    whatsappSent: false,
    category: 'security',
  },
];

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  compliance: number;
  category: 'identity' | 'device' | 'network' | 'data' | 'monitoring';
  lastChecked: Date;
  issues: string[];
}

export interface ZeroTrustSettings {
  zeroTrustEnabled: boolean;
  continuousAuth: boolean;
  microSegmentation: boolean;
  leastPrivilege: boolean;
}

export interface ZeroTrustMetrics {
  overallScore: number;
  identityScore: number;
  deviceScore: number;
  networkScore: number;
  dataScore: number;
  monitoringScore: number;
  totalVerifications: number;
  blockedAttempts: number;
  activeSessions: number;
}

export function useRealTimeZeroTrust() {
  const { user } = useAuth();
  const { devices } = useRealTimeDevices(user?.id);
  const { threats: dbThreats } = useRealTimeThreats(user?.id);
  const { alerts: dbAlerts } = useRealTimeAlerts(user?.id);
  
  const threats = useMemo(() => {
    return user ? dbThreats : demoThreats;
  }, [user, dbThreats]);
  
  const alerts = useMemo(() => {
    return user ? dbAlerts : demoAlerts;
  }, [user, dbAlerts]);
  
  const [settings, setSettings] = useState<ZeroTrustSettings>({
    zeroTrustEnabled: true,
    continuousAuth: true,
    microSegmentation: true,
    leastPrivilege: true,
  });
  
  const [policies, setPolicies] = useState<ZeroTrustPolicy[]>([]);
  const [metrics, setMetrics] = useState<ZeroTrustMetrics>({
    overallScore: 0,
    identityScore: 0,
    deviceScore: 0,
    networkScore: 0,
    dataScore: 0,
    monitoringScore: 0,
    totalVerifications: 0,
    blockedAttempts: 0,
    activeSessions: 1,
  });
  const [loading, setLoading] = useState(true);

  const calculateDeviceTrustScore = useCallback(() => {
    if (devices.length === 0) return { score: 100, issues: [] };
    
    const issues: string[] = [];
    let totalScore = 0;
    
    devices.forEach(device => {
      let deviceScore = 100;
      
      if (device.status === 'critical') {
        deviceScore -= 50;
        issues.push(`${device.name} has critical security issues`);
      } else if (device.status === 'warning') {
        deviceScore -= 20;
      }
      
      if (device.weakPassword) {
        deviceScore -= 15;
        issues.push(`${device.name} has weak password detected`);
      }
      
      if (device.outdatedFirmware) {
        deviceScore -= 10;
        issues.push(`${device.name} needs firmware update`);
      }
      
      if (device.vulnerabilityCount > 0) {
        deviceScore -= Math.min(device.vulnerabilityCount * 5, 25);
        if (device.vulnerabilityCount > 2) {
          issues.push(`${device.name} has ${device.vulnerabilityCount} vulnerabilities`);
        }
      }
      
      if (device.openPorts && device.openPorts.length > 5) {
        deviceScore -= 10;
        issues.push(`${device.name} has ${device.openPorts.length} open ports`);
      }
      
      totalScore += Math.max(deviceScore, 0);
    });
    
    return {
      score: Math.round(totalScore / devices.length),
      issues: issues.slice(0, 5),
    };
  }, [devices]);

  const calculateNetworkSegmentationScore = useCallback(() => {
    const issues: string[] = [];
    let score = 100;
    
    const criticalDevices = devices.filter(d => d.status === 'critical');
    if (criticalDevices.length > 0) {
      score -= criticalDevices.length * 10;
      issues.push(`${criticalDevices.length} devices need isolation`);
    }
    
    const devicesWithManyPorts = devices.filter(d => d.openPorts && d.openPorts.length > 5);
    if (devicesWithManyPorts.length > 0) {
      score -= devicesWithManyPorts.length * 5;
      issues.push(`${devicesWithManyPorts.length} devices have excessive open ports`);
    }
    
    const iotDevices = devices.filter(d => 
      d.type === 'iot' || d.type === 'tv' || d.type === 'speaker'
    );
    if (iotDevices.length > 0) {
      const unsegmented = iotDevices.filter(d => d.status !== 'safe');
      if (unsegmented.length > 0) {
        score -= unsegmented.length * 5;
        issues.push(`${unsegmented.length} IoT devices need network isolation`);
      }
    }
    
    return { score: Math.max(score, 0), issues };
  }, [devices]);

  const calculateMonitoringScore = useCallback(() => {
    const issues: string[] = [];
    let score = 100;
    
    const recentThreats = threats.filter(t => {
      const threatTime = new Date(t.timestamp).getTime();
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return threatTime > hourAgo;
    });
    
    if (recentThreats.length > 0) {
      score -= Math.min(recentThreats.length * 5, 30);
      issues.push(`${recentThreats.length} threats detected in last hour`);
    }
    
    const unblockedThreats = threats.filter(t => !t.blocked);
    if (unblockedThreats.length > 0) {
      score -= unblockedThreats.length * 10;
      issues.push(`${unblockedThreats.length} threats not automatically blocked`);
    }
    
    const criticalThreats = threats.filter(t => t.severity === 'critical' && !t.blocked);
    if (criticalThreats.length > 0) {
      score -= 20;
      issues.push(`${criticalThreats.length} critical unblocked threats require attention`);
    }
    
    return { score: Math.max(score, 0), issues };
  }, [threats]);

  const calculateIdentityScore = useCallback(() => {
    const issues: string[] = [];
    let score = 100;
    
    if (!settings.continuousAuth) {
      score -= 20;
      issues.push('Continuous authentication is disabled');
    }
    
    if (!settings.leastPrivilege) {
      score -= 15;
      issues.push('Least privilege access is disabled');
    }
    
    if (!user) {
      score -= 10;
      issues.push('Running in demo mode without authentication');
    }
    
    return { score: Math.max(score, 0), issues };
  }, [settings.continuousAuth, settings.leastPrivilege, user]);

  const calculateDataProtectionScore = useCallback(() => {
    const issues: string[] = [];
    let score = 100;
    
    if (!settings.zeroTrustEnabled) {
      score -= 30;
      issues.push('Zero Trust architecture is disabled');
    }
    
    return { score: Math.max(score, 0), issues };
  }, [settings.zeroTrustEnabled]);

  useEffect(() => {
    const deviceTrust = calculateDeviceTrustScore();
    const networkSegmentation = calculateNetworkSegmentationScore();
    const monitoring = calculateMonitoringScore();
    const identity = calculateIdentityScore();
    const dataProtection = calculateDataProtectionScore();

    const newPolicies: ZeroTrustPolicy[] = [
      {
        id: 'identity-verification',
        name: 'Identity Verification',
        description: 'Verify all users before granting access',
        enabled: settings.continuousAuth,
        compliance: identity.score,
        category: 'identity',
        lastChecked: new Date(),
        issues: identity.issues,
      },
      {
        id: 'device-trust',
        name: 'Device Trust Assessment',
        description: 'Validate device security posture',
        enabled: true,
        compliance: deviceTrust.score,
        category: 'device',
        lastChecked: new Date(),
        issues: deviceTrust.issues,
      },
      {
        id: 'network-segmentation',
        name: 'Network Microsegmentation',
        description: 'Segment network to contain breaches',
        enabled: settings.microSegmentation,
        compliance: networkSegmentation.score,
        category: 'network',
        lastChecked: new Date(),
        issues: networkSegmentation.issues,
      },
      {
        id: 'least-privilege',
        name: 'Least Privilege Access',
        description: 'Grant minimum required permissions',
        enabled: settings.leastPrivilege,
        compliance: settings.leastPrivilege ? 96 : 50,
        category: 'identity',
        lastChecked: new Date(),
        issues: settings.leastPrivilege ? [] : ['Least privilege access is disabled'],
      },
      {
        id: 'continuous-monitoring',
        name: 'Continuous Monitoring',
        description: 'Monitor all activities in real-time',
        enabled: true,
        compliance: monitoring.score,
        category: 'monitoring',
        lastChecked: new Date(),
        issues: monitoring.issues,
      },
      {
        id: 'data-encryption',
        name: 'Data Encryption',
        description: 'Encrypt all data in transit and at rest',
        enabled: true,
        compliance: dataProtection.score,
        category: 'data',
        lastChecked: new Date(),
        issues: dataProtection.issues,
      },
    ];

    setPolicies(newPolicies);

    const enabledPolicies = newPolicies.filter(p => p.enabled);
    const avgScore = enabledPolicies.length > 0
      ? Math.round(enabledPolicies.reduce((sum, p) => sum + p.compliance, 0) / enabledPolicies.length)
      : 0;

    const blockedCount = threats.filter(t => t.blocked).length;
    const deviceVerifications = devices.length * 5;
    const threatVerifications = threats.length * 3;
    const alertVerifications = alerts.length * 2;
    const totalVerifications = deviceVerifications + threatVerifications + alertVerifications;

    setMetrics({
      overallScore: avgScore,
      identityScore: identity.score,
      deviceScore: deviceTrust.score,
      networkScore: networkSegmentation.score,
      dataScore: dataProtection.score,
      monitoringScore: monitoring.score,
      totalVerifications,
      blockedAttempts: blockedCount,
      activeSessions: 1,
    });

    setLoading(false);
  }, [
    devices, 
    threats, 
    alerts, 
    settings,
    calculateDeviceTrustScore,
    calculateNetworkSegmentationScore,
    calculateMonitoringScore,
    calculateIdentityScore,
    calculateDataProtectionScore,
  ]);

  useEffect(() => {
    if (!user) return;

    if (!supabase) return;
    
    supabase
      .from('security_settings')
      .select('zero_trust_enabled, continuous_auth, micro_segmentation, least_privilege')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings(prev => ({
            ...prev,
            zeroTrustEnabled: data.zero_trust_enabled ?? true,
            continuousAuth: data.continuous_auth ?? true,
            microSegmentation: data.micro_segmentation ?? true,
            leastPrivilege: data.least_privilege ?? true,
          }));
        }
      });
  }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<ZeroTrustSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    if (user && supabase) {
      const updateData: Record<string, boolean> = {};
      if ('zeroTrustEnabled' in newSettings) updateData.zero_trust_enabled = newSettings.zeroTrustEnabled!;
      if ('continuousAuth' in newSettings) updateData.continuous_auth = newSettings.continuousAuth!;
      if ('microSegmentation' in newSettings) updateData.micro_segmentation = newSettings.microSegmentation!;
      if ('leastPrivilege' in newSettings) updateData.least_privilege = newSettings.leastPrivilege!;
      
      await supabase
        .from('security_settings')
        .upsert({
          user_id: user.id,
          ...updateData,
          updated_at: new Date().toISOString(),
        });
    }
  }, [user]);

  const togglePolicy = useCallback((policyId: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === policyId ? { ...p, enabled: !p.enabled } : p
    ));
  }, []);

  const verifyDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return { verified: false, reason: 'Device not found' };
    
    const issues: string[] = [];
    
    if (device.status === 'critical') {
      issues.push('Device has critical security status');
    }
    if (device.weakPassword) {
      issues.push('Weak password detected');
    }
    if (device.outdatedFirmware) {
      issues.push('Firmware is outdated');
    }
    if (device.vulnerabilityCount > 0) {
      issues.push(`${device.vulnerabilityCount} vulnerabilities detected`);
    }
    
    return {
      verified: issues.length === 0,
      deviceName: device.name,
      trustScore: issues.length === 0 ? 100 : Math.max(100 - issues.length * 25, 0),
      issues,
      lastSeen: device.lastSeen,
    };
  }, [devices]);

  return {
    settings,
    policies,
    metrics,
    loading,
    updateSettings,
    togglePolicy,
    verifyDevice,
    devices,
    threats,
  };
}
