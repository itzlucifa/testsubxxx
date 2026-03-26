// Core Types for CYBERSHIELD Platform

export type UserRole = 'admin' | 'user' | 'viewer';
export type SubscriptionTier = 'free' | 'professional' | 'enterprise';
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DeviceStatus = 'safe' | 'warning' | 'critical';
export type VulnerabilityStatus = 'open' | 'patching' | 'patched';
export type ComplianceFramework = 'SOX' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'ISO27001';
export type EvidenceType = 'disk' | 'memory' | 'network' | 'file' | 'log';
export type TestCategory = 'network' | 'web' | 'api' | 'social' | 'physical';

// User & Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  subscription: SubscriptionTier;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Dashboard & Security Score
export interface SecurityScore {
  overall: number; // 0-100
  networkSecurity: number;
  deviceSecurity: number;
  threatProtection: number;
  vulnerabilityManagement: number;
  compliance: number;
}

export interface DashboardStats {
  riskScore: number;
  devicesOnline: number;
  threatsBlocked: number;
  networkStatus: 'healthy' | 'degraded' | 'critical';
  securityScore: SecurityScore;
}

// Network Monitoring
export interface NetworkMetrics {
  bandwidth: {
    download: number; // Mbps
    upload: number; // Mbps
  };
  latency: number; // ms
  packetLoss: number; // percentage
  activeConnections: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface NetworkEvent {
  id: string;
  timestamp: Date;
  type: 'connection' | 'disconnection' | 'anomaly' | 'alert';
  description: string;
  severity: ThreatSeverity;
}

// Device Management
export interface Device {
  id: string;
  name: string;
  type: 'router' | 'iot' | 'camera' | 'computer' | 'printer' | 'phone' | 'tv' | 'speaker' | 'nas';
  ipAddress: string;
  macAddress: string;
  manufacturer: string;
  os: string;
  firmware: string;
  status: DeviceStatus;
  vulnerabilityCount: number;
  lastSeen: Date;
  openPorts: number[];
  weakPassword: boolean;
  outdatedFirmware: boolean;
}

// Threat Intelligence
export interface Threat {
  id: string;
  type: 'ransomware' | 'botnet' | 'deepfake' | 'phishing' | 'malware' | 'port-scan' | 'brute-force' | 'ddos' | 'zero-day';
  severity: ThreatSeverity;
  source: string;
  target: string;
  timestamp: Date;
  blocked: boolean;
  autoRemediated: boolean;
  confidence: number; // 0-100
  description: string;
  descriptionHindi?: string;
}

// Vulnerability Management
export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  cvssScore: number; // 0-10
  severity: ThreatSeverity;
  status: VulnerabilityStatus;
  affectedDevices: string[];
  discoveredAt: Date;
  patchAvailable: boolean;
}

// AI & Automation
export interface AIAgent {
  id: string;
  name: string;
  type: 'scanner' | 'analyzer' | 'remediator' | 'deepfake-detector' | 'monitor';
  status: 'active' | 'idle' | 'offline';
  accuracy: number; // percentage
  tasksCompleted: number;
  lastActivity: Date;
}

export interface SOARPlaybook {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  steps: string[];
  successRate: number;
  avgResponseTime: number; // seconds
  executionCount: number;
  enabled: boolean;
}

// Forensics & Investigation
export interface ForensicCase {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'closed';
  priority: ThreatSeverity;
  createdAt: Date;
  closedAt?: Date;
  investigator: string;
  evidence: ForensicEvidence[];
  timeline: ForensicEvent[];
}

export interface ForensicEvidence {
  id: string;
  type: EvidenceType;
  description: string;
  hash: string;
  verified: boolean;
  collectedAt: Date;
  collectedBy: string;
}

export interface ForensicEvent {
  timestamp: Date;
  action: string;
  user: string;
  details: string;
}

// Penetration Testing
export interface PenTest {
  id: string;
  name: string;
  category: TestCategory;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  findings: PenTestFinding[];
  score: number; // 0-100
}

export interface PenTestFinding {
  id: string;
  severity: ThreatSeverity;
  title: string;
  description: string;
  recommendation: string;
  cvssScore?: number;
}

// Compliance & Governance
export interface ComplianceStatus {
  framework: ComplianceFramework;
  score: number; // 0-100
  requirements: ComplianceRequirement[];
  lastAudit: Date;
  nextAudit: Date;
  certified: boolean;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  fulfilled: boolean;
  evidence: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  violationCount: number;
  lastUpdated: Date;
  createdBy: string;
}

export interface RiskAssessment {
  id: string;
  asset: string;
  threat: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // likelihood * impact
  mitigation: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted';
}

// Training
export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // minutes
  completed: boolean;
  progress: number; // percentage
  certification: boolean;
}

// WiFi Security
export interface WiFiNetwork {
  id: string;
  ssid: string;
  bssid: string;
  security: 'WPA3' | 'WPA2' | 'WPA' | 'WEP' | 'Open';
  signalStrength: number; // dBm
  channel: number;
  encryption: string;
  isRogue: boolean;
  vulnerabilities: string[];
}

// Azure Integration
export interface AzureService {
  id: string;
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  enabled: boolean;
  lastSync: Date;
}

// Reports
export interface Report {
  id: string;
  type: string;
  title: string;
  generatedAt: Date;
  format: 'pdf' | 'csv' | 'json' | 'excel';
  size: number; // bytes
  downloadUrl: string;
}

// Alerts
export interface Alert {
  id: string;
  title: string;
  titleHindi?: string;
  message: string;
  messageHindi?: string;
  severity: ThreatSeverity;
  timestamp: Date;
  read: boolean;
  whatsappSent: boolean;
  category: string;
}

// Security Metrics
export interface SecurityMetrics {
  threatsBlocked: number;
  vulnerabilitiesFixed: number;
  devicesProtected: number;
  uptime: number;
  securityScore: number;
  deepfakesBlocked: number;
  portsSecured: number;
  autoRemediations: number;
}

// Settings
export interface SystemSettings {
  autoRemediation: boolean;
  deepfakeDetection: boolean;
  postQuantumCrypto: boolean;
  language: 'en' | 'hi';
  notifications: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    push: boolean;
  };
  zeroTrust: {
    enabled: boolean;
    continuousAuth: boolean;
    microSegmentation: boolean;
  };
}
