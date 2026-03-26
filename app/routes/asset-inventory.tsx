import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { Database, HardDrive, Monitor, Smartphone, Search, RefreshCw } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import styles from './asset-inventory.module.css';

interface Asset {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  firmware: string;
  ipAddress: string;
  status: 'safe' | 'at-risk' | 'critical';
  lastSeen: Date;
}

export default function AssetInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'MacBook Pro M1',
      type: 'computer',
      manufacturer: 'Apple',
      firmware: 'macOS Sonoma 14.2',
      ipAddress: '192.168.1.100',
      status: 'safe',
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      type: 'phone',
      manufacturer: 'Apple',
      firmware: 'iOS 17.2',
      ipAddress: '192.168.1.101',
      status: 'safe',
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Dell Latitude 7420',
      type: 'computer',
      manufacturer: 'Dell',
      firmware: 'Windows 11 Pro',
      ipAddress: '192.168.1.102',
      status: 'at-risk',
      lastSeen: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '4',
      name: 'Samsung Galaxy S23',
      type: 'phone',
      manufacturer: 'Samsung',
      firmware: 'Android 14',
      ipAddress: '192.168.1.103',
      status: 'safe',
      lastSeen: new Date()
    },
    {
      id: '5',
      name: 'Synology NAS',
      type: 'server',
      manufacturer: 'Synology',
      firmware: 'DSM 7.2',
      ipAddress: '192.168.1.10',
      status: 'safe',
      lastSeen: new Date()
    },
    {
      id: '6',
      name: 'Cisco Router',
      type: 'router',
      manufacturer: 'Cisco',
      firmware: 'IOS 15.7',
      ipAddress: '192.168.1.1',
      status: 'at-risk',
      lastSeen: new Date()
    }
  ]);

  const handleScan = () => {
    setScanning(true);
    toast({
      title: "Scanning Network",
      description: "Discovering devices on the network...",
    });

    setTimeout(() => {
      const newAsset: Asset = {
        id: Date.now().toString(),
        name: `Device-${Math.floor(Math.random() * 1000)}`,
        type: ['computer', 'phone', 'tablet', 'router', 'server'][Math.floor(Math.random() * 5)],
        manufacturer: ['Apple', 'Dell', 'HP', 'Samsung', 'Cisco'][Math.floor(Math.random() * 5)],
        firmware: 'Unknown',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 200 + 50)}`,
        status: 'safe',
        lastSeen: new Date()
      };

      setAssets(prev => [newAsset, ...prev]);
      setScanning(false);
      toast({
        title: "Scan Complete",
        description: `Found ${assets.length + 1} devices`,
      });
    }, 2000);
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.ipAddress.includes(searchQuery)
  );

  const assetsByType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const safeAssets = assets.filter(a => a.status === 'safe').length;
  const atRiskAssets = assets.filter(a => a.status === 'at-risk').length;
  const criticalAssets = assets.filter(a => a.status === 'critical').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'computer':
        return <Monitor size={20} />;
      case 'phone':
      case 'tablet':
        return <Smartphone size={20} />;
      case 'server':
        return <Database size={20} />;
      default:
        return <HardDrive size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'default';
      case 'at-risk':
        return 'outline';
      case 'critical':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Asset Inventory</h1>
          <p className={styles.subtitle}>Comprehensive asset catalog and lifecycle management</p>
        </div>
        <button className={styles.scanButton} onClick={handleScan} disabled={scanning}>
          <RefreshCw size={18} className={scanning ? styles.spinning : ''} />
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Database size={20} />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{assets.length}</div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Safe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{safeAssets}</div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{atRiskAssets}</div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{criticalAssets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search assets by name, type, manufacturer, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Assets */}
      <Tabs defaultValue="all" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="all">All Assets ({filteredAssets.length})</TabsTrigger>
          <TabsTrigger value="computer">Computers ({assets.filter(a => a.type === 'computer').length})</TabsTrigger>
          <TabsTrigger value="phone">Mobile ({assets.filter(a => a.type === 'phone' || a.type === 'tablet').length})</TabsTrigger>
          <TabsTrigger value="other">Other ({assets.filter(a => a.type !== 'computer' && a.type !== 'phone' && a.type !== 'tablet').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className={styles.cardGrid}>
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className={styles.assetCard}>
                <CardHeader>
                  <CardTitle className={styles.cardTitle}>
                    {getTypeIcon(asset.type)}
                    {asset.name}
                  </CardTitle>
                  <CardDescription>
                    {asset.manufacturer} - {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.badges}>
                    <Badge variant="outline">{asset.type.toUpperCase()}</Badge>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status.toUpperCase()}</Badge>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>OS/Firmware:</span>
                      <span className={styles.metricValue}>{asset.firmware}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>IP Address:</span>
                      <span className={styles.metricValue}>{asset.ipAddress}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Last Seen:</span>
                      <span className={styles.metricValue}>{asset.lastSeen.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAssets.length === 0 && (
              <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                <Database size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No assets found</h3>
                <p className={styles.emptyText}>No assets match your search criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="computer">
          <div className={styles.cardGrid}>
            {filteredAssets.filter(a => a.type === 'computer').map((asset) => (
              <Card key={asset.id} className={styles.assetCard}>
                <CardHeader>
                  <CardTitle className={styles.cardTitle}>
                    {getTypeIcon(asset.type)}
                    {asset.name}
                  </CardTitle>
                  <CardDescription>
                    {asset.manufacturer}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.badges}>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status.toUpperCase()}</Badge>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>OS:</span>
                      <span className={styles.metricValue}>{asset.firmware}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>IP:</span>
                      <span className={styles.metricValue}>{asset.ipAddress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="phone">
          <div className={styles.cardGrid}>
            {filteredAssets.filter(a => a.type === 'phone' || a.type === 'tablet').map((asset) => (
              <Card key={asset.id} className={styles.assetCard}>
                <CardHeader>
                  <CardTitle className={styles.cardTitle}>
                    {getTypeIcon(asset.type)}
                    {asset.name}
                  </CardTitle>
                  <CardDescription>
                    {asset.manufacturer}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.badges}>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status.toUpperCase()}</Badge>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>OS:</span>
                      <span className={styles.metricValue}>{asset.firmware}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>IP:</span>
                      <span className={styles.metricValue}>{asset.ipAddress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="other">
          <div className={styles.cardGrid}>
            {filteredAssets.filter(a => a.type !== 'computer' && a.type !== 'phone' && a.type !== 'tablet').map((asset) => (
              <Card key={asset.id} className={styles.assetCard}>
                <CardHeader>
                  <CardTitle className={styles.cardTitle}>
                    {getTypeIcon(asset.type)}
                    {asset.name}
                  </CardTitle>
                  <CardDescription>
                    {asset.manufacturer} - {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.badges}>
                    <Badge variant="outline">{asset.type.toUpperCase()}</Badge>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status.toUpperCase()}</Badge>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Firmware:</span>
                      <span className={styles.metricValue}>{asset.firmware}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>IP:</span>
                      <span className={styles.metricValue}>{asset.ipAddress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
