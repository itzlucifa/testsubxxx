import { useState } from "react";
import type { Route } from "./+types/settings";
import { AppLayout } from "~/components/layout/app-layout";
import { Switch } from "~/components/ui/switch/switch";
import { BackButton } from "~/components/ui/back-button";
import { Shield, Zap, Lock, MessageSquare, Mic, Wifi, Target } from "lucide-react";
import { useRealTimeAIAgents } from "~/hooks/use-real-time-ai-agents";
import { useRealTimeSecurityMetrics } from "~/hooks/use-real-time-security-metrics";
import { useAuth } from "~/hooks/use-auth";
import styles from "./settings.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - CYBERSHIELD" },
    { name: "description", content: "Configure CYBERSHIELD security features" },
  ];
}

export default function Settings() {
  const { user } = useAuth();
  const [autoRemediation, setAutoRemediation] = useState(true);
  const [deepfakeDetection, setDeepfakeDetection] = useState(true);
  const [quantumReady, setQuantumReady] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [voiceAssistant, setVoiceAssistant] = useState(false);
  const [networkMonitoring, setNetworkMonitoring] = useState(true);
  
  const { agents, loading: agentsLoading } = useRealTimeAIAgents();
  const { metrics, loading: metricsLoading } = useRealTimeSecurityMetrics(user?.id);
  
  const allLoading = agentsLoading || metricsLoading;

  if (allLoading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading settings...</p>
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
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Configure autonomous AI cybersecurity features</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Core Security Features</h2>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>Automatic Remediation</h3>
              <p className={styles.settingDescription}>
                CYBERSHIELD automatically fixes vulnerabilities, closes open ports, blocks threats, and applies security
                updates without manual intervention
              </p>
              <div className={styles.featureBadge}>
                <Zap size={14} />
                <span>Core Feature - Always Active</span>
              </div>
            </div>
            <Switch checked={autoRemediation} onCheckedChange={setAutoRemediation} />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>Deepfake Detection</h3>
              <p className={styles.settingDescription}>
                Advanced AI detects deepfake audio and video in real-time with 98%+ accuracy. Protects against boss
                fraud, impersonation scams, and fake calls
              </p>
              <div className={styles.featureBadge}>
                <Shield size={14} />
                <span>AI-Powered Protection</span>
              </div>
            </div>
            <Switch checked={deepfakeDetection} onCheckedChange={setDeepfakeDetection} />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>Post-Quantum Cryptography</h3>
              <p className={styles.settingDescription}>
                Future-proof encryption using NIST-approved quantum-resistant algorithms (CRYSTALS-Kyber, Dilithium).
                Protection against quantum computer attacks
              </p>
              <div className={`${styles.featureBadge} ${styles.quantum}`}>
                <Lock size={14} />
                <span>Quantum Ready</span>
              </div>
            </div>
            <Switch checked={quantumReady} onCheckedChange={setQuantumReady} />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>Continuous Network Monitoring</h3>
              <p className={styles.settingDescription}>
                24/7 network scanning for new devices, open ports, weak passwords, outdated firmware, and exposed
                services
              </p>
              <div className={styles.featureBadge}>
                <Wifi size={14} />
                <span>Real-Time Scanning</span>
              </div>
            </div>
            <Switch checked={networkMonitoring} onCheckedChange={setNetworkMonitoring} />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications & Communication</h2>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>WhatsApp Alerts</h3>
              <p className={styles.settingDescription}>
                Receive instant security alerts via WhatsApp in English or Hindi. Messages like "Hack blocked!" sent
                immediately when threats are detected
              </p>
              <div className={styles.featureBadge}>
                <MessageSquare size={14} />
                <span>Instant Notifications</span>
              </div>
            </div>
            <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>Voice Assistant (Hindi/English)</h3>
              <p className={styles.settingDescription}>
                Control CYBERSHIELD with voice commands. Ask security status, run scans, and get reports in your
                preferred language
              </p>
              <div className={styles.featureBadge}>
                <Mic size={14} />
                <span>Hands-Free Control</span>
              </div>
            </div>
            <Switch checked={voiceAssistant} onCheckedChange={setVoiceAssistant} />
          </div>
        </div>

        <div className={styles.aiSwarmSection}>
          <h2 className={styles.sectionTitle}>AI Swarm Status</h2>
          <p className={styles.settingDescription}>
            Multiple AI agents work together to scan, analyze, and remediate threats autonomously
          </p>

          <div className={styles.agentGrid}>
            {agents.map((agent) => (
              <div key={agent.id} className={styles.agentCard}>
                <h3 className={styles.agentName}>{agent.name}</h3>
                <p className={styles.agentStatus}>● {agent.status}</p>
                <div className={styles.agentStats}>
                  <span>{agent.tasksCompleted} tasks</span>
                  <span>{agent.accuracy}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.metricsSection}>
          <h2 className={styles.sectionTitle}>Security Metrics</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.threatsBlocked}</h3>
              <p className={styles.metricLabel}>Threats Blocked</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.vulnerabilitiesFixed}</h3>
              <p className={styles.metricLabel}>Vulnerabilities Fixed</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.devicesProtected}</h3>
              <p className={styles.metricLabel}>Devices Protected</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.deepfakesBlocked}</h3>
              <p className={styles.metricLabel}>Deepfakes Blocked</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.portsSecured}</h3>
              <p className={styles.metricLabel}>Ports Secured</p>
            </div>
            <div className={styles.metricCard}>
              <h3 className={styles.metricValue}>{metrics.uptime}%</h3>
              <p className={styles.metricLabel}>Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
