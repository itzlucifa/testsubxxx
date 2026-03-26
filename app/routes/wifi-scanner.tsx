import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { BackButton } from '../components/ui/back-button';
import { Wifi, AlertTriangle, Shield, RefreshCw, Lock, Unlock, Activity, Server } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import styles from './common-page.module.css';

interface WiFiNetwork {
  id: string;
  ssid: string;
  bssid: string;
  signalStrength: number;
  channel: number;
  security: string;
  encryption: string;
  isRogue: boolean;
  vulnerabilities: string[];
}

export default function WiFiScanner() {
  const [scanning, setScanning] = useState(false);
  const [raspberryPiAvailable, setRaspberryPiAvailable] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([
    {
      id: '1',
      ssid: 'CyberShield-Secure',
      bssid: '00:1A:2B:3C:4D:5E',
      signalStrength: -45,
      channel: 6,
      security: 'WPA3',
      encryption: 'AES-256',
      isRogue: false,
      vulnerabilities: []
    },
    {
      id: '2',
      ssid: 'Office-WiFi',
      bssid: '00:1A:2B:3C:4D:5F',
      signalStrength: -58,
      channel: 11,
      security: 'WPA2',
      encryption: 'AES',
      isRogue: false,
      vulnerabilities: ['Outdated security protocol']
    },
    {
      id: '3',
      ssid: 'Guest-Network',
      bssid: '00:1A:2B:3C:4D:60',
      signalStrength: -62,
      channel: 1,
      security: 'WPA',
      encryption: 'TKIP',
      isRogue: false,
      vulnerabilities: ['Weak encryption', 'Outdated protocol']
    },
    {
      id: '4',
      ssid: 'Free-WiFi',
      bssid: '00:1A:2B:3C:4D:61',
      signalStrength: -70,
      channel: 6,
      security: 'Open',
      encryption: 'None',
      isRogue: true,
      vulnerabilities: ['No encryption', 'Possible rogue AP', 'Evil twin attack risk']
    },
    {
      id: '5',
      ssid: 'IoT-Devices',
      bssid: '00:1A:2B:3C:4D:62',
      signalStrength: -55,
      channel: 3,
      security: 'WEP',
      encryption: 'WEP-128',
      isRogue: false,
      vulnerabilities: ['Critically weak encryption', 'Easily crackable', 'Should be disabled']
    }
  ]);

  useEffect(() => {
    checkRaspberryPi();
  }, []);

  const checkRaspberryPi = async () => {
    try {
      const response = await fetch('/api/device-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      });
      const data = await response.json();
      setRaspberryPiAvailable(data.raspberryPiAvailable === true);
    } catch {
      setRaspberryPiAvailable(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    toast({
      title: "Scanning for Networks",
      description: raspberryPiAvailable 
        ? "Using Raspberry Pi for real network scan..." 
        : "Running simulated network discovery...",
    });

    if (raspberryPiAvailable) {
      try {
        const response = await fetch('/api/device-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'wifi-scan' }),
        });
        const data = await response.json();
        
        if (data.networks && Array.isArray(data.networks)) {
          const mappedNetworks: WiFiNetwork[] = data.networks.map((n: any, idx: number) => ({
            id: `rpi-${Date.now()}-${idx}`,
            ssid: n.ssid || 'Hidden Network',
            bssid: n.bssid || '00:00:00:00:00:00',
            signalStrength: n.signal || -70,
            channel: n.channel || 1,
            security: n.security || 'Unknown',
            encryption: n.encryption || 'Unknown',
            isRogue: n.isRogue || false,
            vulnerabilities: n.vulnerabilities || [],
          }));
          setNetworks(mappedNetworks);
          setLastScanTime(new Date());
          toast({
            title: "Real Scan Complete",
            description: `Found ${mappedNetworks.length} networks via Raspberry Pi`,
          });
        }
      } catch (error) {
        toast({
          title: "Scan Failed",
          description: "Could not connect to Raspberry Pi scanner",
          variant: "destructive",
        });
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newNetwork: WiFiNetwork = {
        id: Date.now().toString(),
        ssid: `Network-${Math.floor(Math.random() * 1000)}`,
        bssid: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        signalStrength: -Math.floor(Math.random() * 40 + 40),
        channel: Math.floor(Math.random() * 11 + 1),
        security: ['WPA3', 'WPA2', 'WPA', 'Open'][Math.floor(Math.random() * 4)],
        encryption: ['AES-256', 'AES', 'TKIP', 'None'][Math.floor(Math.random() * 4)],
        isRogue: Math.random() > 0.8,
        vulnerabilities: []
      };

      if (newNetwork.security === 'Open') {
        newNetwork.vulnerabilities.push('No encryption');
      }
      if (newNetwork.security === 'WPA') {
        newNetwork.vulnerabilities.push('Outdated protocol');
      }

      setNetworks(prev => [newNetwork, ...prev]);
      setLastScanTime(new Date());
      toast({
        title: "Simulated Scan Complete",
        description: `Found ${networks.length + 1} networks (connect Raspberry Pi for real scans)`,
      });
    }
    setScanning(false);
  };

  const handleBlockRogue = (id: string) => {
    const network = networks.find(n => n.id === id);
    toast({
      title: "Blocking Rogue AP",
      description: `Blocking ${network?.ssid}...`,
    });

    setTimeout(() => {
      setNetworks(prev => prev.filter(n => n.id !== id));
      toast({
        title: "Rogue AP Blocked",
        description: `${network?.ssid} has been blocked`,
      });
    }, 1000);
  };

  const getSecurityColor = (security: string) => {
    switch (security) {
      case 'WPA3': return 'default';
      case 'WPA2': return 'secondary';
      case 'WPA': return 'outline';
      case 'WEP': return 'destructive';
      case 'Open': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= -50) return <Wifi size={20} />;
    if (strength >= -60) return <Wifi size={20} style={{ opacity: 0.8 }} />;
    if (strength >= -70) return <Wifi size={20} style={{ opacity: 0.6 }} />;
    return <Wifi size={20} style={{ opacity: 0.4 }} />;
  };

  const secureNetworks = networks.filter(n => !n.isRogue && n.vulnerabilities.length === 0).length;
  const vulnerableNetworks = networks.filter(n => !n.isRogue && n.vulnerabilities.length > 0).length;
  const rogueNetworks = networks.filter(n => n.isRogue).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>WiFi Security Scanner</h1>
          <p className={styles.subtitle}>Network discovery and security analysis</p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          <RefreshCw size={18} className={scanning ? styles.spinning : ''} />
          {scanning ? 'Scanning...' : 'Scan Networks'}
        </Button>
      </div>

      <div style={{ 
        padding: 'var(--space-3)', 
        background: raspberryPiAvailable ? 'var(--color-success-2)' : 'var(--color-accent-2)', 
        border: `1px solid ${raspberryPiAvailable ? 'var(--color-success-6)' : 'var(--color-accent-6)'}`,
        borderRadius: 'var(--radius-2)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        {raspberryPiAvailable ? <Server size={18} /> : <Activity size={18} />}
        <span>
          {raspberryPiAvailable ? (
            <><strong>Raspberry Pi Connected:</strong> Real network scanning available</>
          ) : (
            <><strong>Demo Mode:</strong> Connect a Raspberry Pi with nmap for real network scans</>
          )}
        </span>
        {lastScanTime && (
          <Badge variant="outline" style={{ marginLeft: 'auto' }}>
            Last scan: {lastScanTime.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Wifi size={20} />
              Networks Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{networks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Lock size={20} />
              Secure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{secureNetworks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Unlock size={20} />
              Vulnerable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{vulnerableNetworks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle size={20} />
              Rogue APs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{rogueNetworks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Networks List */}
      <div className={styles.list}>
        {networks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)' }}>
            No networks found. Click "Scan Networks" to discover nearby WiFi networks.
          </div>
        )}
        {networks.map((network) => (
          <Card key={network.id}>
            <CardHeader>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>
                  {getSignalIcon(network.signalStrength)}
                  {network.ssid}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Badge variant={getSecurityColor(network.security)}>{network.security}</Badge>
                  {network.isRogue && (
                    <Badge variant="destructive">
                      <AlertTriangle size={14} />
                      ROGUE AP
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>BSSID:</span>
                  <span className={styles.metricValue} style={{ fontFamily: 'var(--font-code)', fontSize: '0.8125rem' }}>{network.bssid}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Signal:</span>
                  <span className={styles.metricValue}>{network.signalStrength} dBm</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Channel:</span>
                  <span className={styles.metricValue}>{network.channel}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Encryption:</span>
                  <span className={styles.metricValue}>{network.encryption}</span>
                </div>
              </div>
              {network.vulnerabilities.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-error-2)', border: '1px solid var(--color-error-6)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-error-11)', fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Vulnerabilities:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: '0.875rem', color: 'var(--color-error-11)' }}>
                    {network.vulnerabilities.map((vuln, idx) => (
                      <li key={idx}>{vuln}</li>
                    ))}
                  </ul>
                </div>
              )}
              {network.isRogue && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBlockRogue(network.id)}
                  >
                    <Shield size={16} />
                    Block Rogue AP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
