export interface Device {
  id: string;
  name: string;
  type: "router" | "camera" | "printer" | "laptop" | "smartphone" | "smart-tv" | "smart-speaker" | "nas" | "iot-device";
  status: "safe" | "vulnerable" | "needs-update" | "critical";
  ipAddress: string;
  macAddress: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  openPorts: number[];
  vulnerabilities: number;
  lastSeen: Date;
  autoFixed: boolean;
  weakPasswords: boolean;
  outdatedSoftware: boolean;
  exposedServices: string[];
}

export interface Threat {
  id: string;
  type: "ransomware" | "botnet" | "phishing" | "deepfake" | "zero-day" | "credential-compromise" | "malware" | "ddos";
  severity: "low" | "medium" | "high" | "critical";
  status: "blocked" | "monitoring" | "resolved" | "investigating";
  description: string;
  descriptionHindi?: string;
  detectedAt: Date;
  affectedDevices: string[];
  autoRemediated: boolean;
  remediationAction: string;
  confidenceScore: number;
}

export interface Alert {
  id: string;
  title: string;
  titleHindi?: string;
  message: string;
  messageHindi?: string;
  type: "success" | "warning" | "error" | "info";
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  whatsappSent: boolean;
}

export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  scheduledFor: Date;
  duration: string;
  status: "pending" | "in-progress" | "completed";
  checksCompleted: number;
  totalChecks: number;
  agent: string;
  checkType: "vulnerability-scan" | "threat-detection" | "firmware-update" | "port-scan" | "deepfake-scan";
}

export interface AIAgent {
  id: string;
  name: string;
  type: "scanner" | "analyzer" | "remediator" | "monitor" | "deepfake-detector";
  status: "active" | "idle" | "updating";
  tasksCompleted: number;
  accuracy: number;
  lastActive: Date;
}

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

// Mock Devices - Comprehensive list
export const mockDevices: Device[] = [
  {
    id: "1",
    name: "Linksys AC1200 Router",
    type: "router",
    status: "safe",
    ipAddress: "192.168.1.1",
    macAddress: "00:14:22:01:23:45",
    manufacturer: "Linksys",
    model: "AC1200",
    firmwareVersion: "2.1.3",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "2",
    name: "CCTV Camera - Front Door",
    type: "camera",
    status: "safe",
    ipAddress: "192.168.1.105",
    macAddress: "00:14:22:01:23:46",
    manufacturer: "Hikvision",
    model: "DS-2CD2021G1",
    firmwareVersion: "5.6.8",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "3",
    name: "HP LaserJet Printer",
    type: "printer",
    status: "safe",
    ipAddress: "192.168.1.110",
    macAddress: "00:14:22:01:23:47",
    manufacturer: "HP",
    model: "LaserJet Pro M404",
    firmwareVersion: "4.2.1",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "4",
    name: "Family Laptop",
    type: "laptop",
    status: "needs-update",
    ipAddress: "192.168.1.120",
    macAddress: "00:14:22:01:23:48",
    manufacturer: "Dell",
    model: "Inspiron 15",
    firmwareVersion: "Windows 11",
    openPorts: [445, 3389],
    vulnerabilities: 5,
    lastSeen: new Date(),
    autoFixed: false,
    weakPasswords: true,
    outdatedSoftware: true,
    exposedServices: ["SMB", "RDP"],
  },
  {
    id: "5",
    name: "iPhone 14",
    type: "smartphone",
    status: "vulnerable",
    ipAddress: "192.168.1.125",
    macAddress: "00:14:22:01:23:49",
    manufacturer: "Apple",
    model: "iPhone 14",
    firmwareVersion: "iOS 16.3",
    openPorts: [],
    vulnerabilities: 3,
    lastSeen: new Date(),
    autoFixed: false,
    weakPasswords: false,
    outdatedSoftware: true,
    exposedServices: [],
  },
  {
    id: "6",
    name: "Samsung Smart TV",
    type: "smart-tv",
    status: "safe",
    ipAddress: "192.168.1.130",
    macAddress: "00:14:22:01:23:50",
    manufacturer: "Samsung",
    model: "QN65Q80A",
    firmwareVersion: "Tizen 6.5",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "7",
    name: "Amazon Echo",
    type: "smart-speaker",
    status: "safe",
    ipAddress: "192.168.1.135",
    macAddress: "00:14:22:01:23:51",
    manufacturer: "Amazon",
    model: "Echo Dot 4th Gen",
    firmwareVersion: "v1.2.3",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "8",
    name: "Home NAS",
    type: "nas",
    status: "safe",
    ipAddress: "192.168.1.140",
    macAddress: "00:14:22:01:23:52",
    manufacturer: "Synology",
    model: "DS220+",
    firmwareVersion: "DSM 7.1",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "9",
    name: "Smart Doorbell",
    type: "iot-device",
    status: "safe",
    ipAddress: "192.168.1.145",
    macAddress: "00:14:22:01:23:53",
    manufacturer: "Ring",
    model: "Video Doorbell Pro",
    firmwareVersion: "3.2.1",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
  {
    id: "10",
    name: "Philips Hue Bridge",
    type: "iot-device",
    status: "safe",
    ipAddress: "192.168.1.150",
    macAddress: "00:14:22:01:23:54",
    manufacturer: "Philips",
    model: "Hue Bridge v2",
    firmwareVersion: "1944144020",
    openPorts: [],
    vulnerabilities: 0,
    lastSeen: new Date(),
    autoFixed: true,
    weakPasswords: false,
    outdatedSoftware: false,
    exposedServices: [],
  },
];

// Mock Threats - Comprehensive threat scenarios
export const mockThreats: Threat[] = [
  {
    id: "1",
    type: "ransomware",
    severity: "critical",
    status: "blocked",
    description: "WannaCry-style ransomware attack blocked on Family Laptop",
    descriptionHindi: "फैमिली लैपटॉप पर WannaCry जैसा रैंसमवेयर हमला रोका गया",
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    affectedDevices: ["4"],
    autoRemediated: true,
    remediationAction: "Isolated device, blocked malicious connections, quarantined files",
    confidenceScore: 99.8,
  },
  {
    id: "2",
    type: "botnet",
    severity: "high",
    status: "blocked",
    description: "Mirai botnet C&C communication detected and blocked from IoT devices",
    descriptionHindi: "IoT डिवाइस से Mirai बॉटनेट संचार पता चला और रोका गया",
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    affectedDevices: ["9", "10"],
    autoRemediated: true,
    remediationAction: "Blocked C&C servers, updated firmware, changed default passwords",
    confidenceScore: 97.5,
  },
  {
    id: "3",
    type: "deepfake",
    severity: "high",
    status: "blocked",
    description: "Deepfake video call attempt detected - Boss fraud attempt prevented",
    descriptionHindi: "डीपफेक वीडियो कॉल प्रयास पता चला - बॉस धोखाधड़ी रोकी गई",
    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    affectedDevices: ["4"],
    autoRemediated: true,
    remediationAction: "Terminated call, alerted user, logged incident",
    confidenceScore: 98.2,
  },
  {
    id: "4",
    type: "phishing",
    severity: "medium",
    status: "blocked",
    description: "Phishing email with malicious link blocked",
    descriptionHindi: "दुर्भावनापूर्ण लिंक वाला फ़िशिंग ईमेल अवरोधित",
    detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    affectedDevices: ["4", "5"],
    autoRemediated: true,
    remediationAction: "Quarantined email, blocked sender, updated filters",
    confidenceScore: 95.3,
  },
  {
    id: "5",
    type: "zero-day",
    severity: "critical",
    status: "monitoring",
    description: "Potential zero-day exploit detected targeting router firmware",
    descriptionHindi: "राउटर फर्मवेयर को लक्षित करने वाला संभावित zero-day exploit पाया गया",
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    affectedDevices: ["1"],
    autoRemediated: false,
    remediationAction: "Monitoring traffic, applied temporary mitigation",
    confidenceScore: 87.6,
  },
];

// Mock Alerts - Bilingual WhatsApp-style alerts
export const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "Hack blocked!",
    titleHindi: "हैक अवरोधित!",
    message: "Ransomware attack blocked on your network. We isolated the device. Your data is safe. ✅",
    messageHindi: "आपके नेटवर्क पर रैंसमवेयर हमला अवरुद्ध। हमने डिवाइस को अलग कर दिया। आपका डेटा सुरक्षित है। ✅",
    type: "success",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionRequired: false,
    whatsappSent: true,
  },
  {
    id: "2",
    title: "Deepfake detected!",
    titleHindi: "डीपफेक पाया गया!",
    message: "Fake video call blocked. AI detected 98% chance of deepfake. Stay safe! 🛡️",
    messageHindi: "नकली वीडियो कॉल अवरोधित। AI ने 98% डीपफेक की संभावना पाई। सुरक्षित रहें! 🛡️",
    type: "warning",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
    actionRequired: false,
    whatsappSent: true,
  },
  {
    id: "3",
    title: "Device updated",
    titleHindi: "डिवाइस अपडेट हो गया",
    message: "Router firmware updated automatically. Security improved. No action needed.",
    messageHindi: "राउटर फर्मवेयर स्वचालित रूप से अपडेट हो गया। सुरक्षा में सुधार। कोई कार्रवाई की जरूरत नहीं।",
    type: "success",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    actionRequired: false,
    whatsappSent: true,
  },
  {
    id: "4",
    title: "Action needed",
    titleHindi: "कार्रवाई जरूरी",
    message: "Smartphone has 3 vulnerabilities. Please update iOS to latest version.",
    messageHindi: "स्मार्टफोन में 3 कमजोरियां हैं। कृपया iOS को नवीनतम संस्करण में अपडेट करें।",
    type: "warning",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    read: true,
    actionRequired: true,
    whatsappSent: true,
  },
  {
    id: "5",
    title: "Botnet stopped",
    titleHindi: "बॉटनेट रोका गया",
    message: "Your IoT devices were being recruited into a botnet. We stopped it. ✅",
    messageHindi: "आपके IoT उपकरणों को बॉटनेट में भर्ती किया जा रहा था। हमने इसे रोक दिया। ✅",
    type: "success",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    actionRequired: false,
    whatsappSent: true,
  },
];

// Mock Security Checks - Scheduled AI agent activities
export const mockSecurityChecks: SecurityCheck[] = [
  {
    id: "1",
    name: "Network vulnerability scan",
    description: "5 of 10 checks, CYBERSHIELD",
    scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
    duration: "10:00-10:30",
    status: "pending",
    checksCompleted: 5,
    totalChecks: 10,
    agent: "CYBERSHIELD",
    checkType: "vulnerability-scan",
  },
  {
    id: "2",
    name: "Threat detection update",
    description: "6 of 10 checks, CYBERSHIELD",
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
    duration: "11:00-11:45",
    status: "pending",
    checksCompleted: 6,
    totalChecks: 10,
    agent: "CYBERSHIELD",
    checkType: "threat-detection",
  },
  {
    id: "3",
    name: "Weekly report",
    description: "3 of 5 alerts, CYBERSHIELD",
    scheduledFor: new Date(Date.now() + 3 * 60 * 60 * 1000),
    duration: "12:00-12:15",
    status: "pending",
    checksCompleted: 3,
    totalChecks: 5,
    agent: "CYBERSHIELD",
    checkType: "vulnerability-scan",
  },
  {
    id: "4",
    name: "Automatic fixes",
    description: "1 of 2 actions taken",
    scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000),
    duration: "14:00-14:15",
    status: "pending",
    checksCompleted: 1,
    totalChecks: 2,
    agent: "CYBERSHIELD",
    checkType: "firmware-update",
  },
  {
    id: "5",
    name: "Deepfake detection",
    description: "2 of 2 threats neutralized",
    scheduledFor: new Date(Date.now() + 5 * 60 * 60 * 1000),
    duration: "15:00-15:30",
    status: "pending",
    checksCompleted: 2,
    totalChecks: 2,
    agent: "CYBERSHIELD",
    checkType: "deepfake-scan",
  },
  {
    id: "6",
    name: "Port security scan",
    description: "Scanning for open ports",
    scheduledFor: new Date(Date.now() + 6 * 60 * 60 * 1000),
    duration: "16:00-16:20",
    status: "pending",
    checksCompleted: 0,
    totalChecks: 8,
    agent: "CYBERSHIELD",
    checkType: "port-scan",
  },
];

// Mock AI Agents - Swarm of AI agents
export const mockAIAgents: AIAgent[] = [
  {
    id: "1",
    name: "Network Scanner",
    type: "scanner",
    status: "active",
    tasksCompleted: 1234,
    accuracy: 99.2,
    lastActive: new Date(),
  },
  {
    id: "2",
    name: "Threat Analyzer",
    type: "analyzer",
    status: "active",
    tasksCompleted: 856,
    accuracy: 97.8,
    lastActive: new Date(),
  },
  {
    id: "3",
    name: "Auto-Remediator",
    type: "remediator",
    status: "active",
    tasksCompleted: 523,
    accuracy: 98.5,
    lastActive: new Date(),
  },
  {
    id: "4",
    name: "Deepfake Detector",
    type: "deepfake-detector",
    status: "active",
    tasksCompleted: 342,
    accuracy: 98.2,
    lastActive: new Date(),
  },
  {
    id: "5",
    name: "Continuous Monitor",
    type: "monitor",
    status: "active",
    tasksCompleted: 9876,
    accuracy: 99.7,
    lastActive: new Date(),
  },
];

// Mock Security Metrics
export const mockSecurityMetrics: SecurityMetrics = {
  threatsBlocked: 127,
  vulnerabilitiesFixed: 342,
  devicesProtected: 10,
  uptime: 99.9,
  securityScore: 94,
  deepfakesBlocked: 12,
  portsSecured: 45,
  autoRemediations: 89,
};
