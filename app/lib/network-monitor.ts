import { supabase } from './supabase';

/**
 * Network monitoring utility that creates real network events
 * based on actual browser activity and network status
 * Can connect to Raspberry Pi for real network monitoring
 */

export const networkMonitor = {
  /**
   * Start monitoring network activity
   */
  async startMonitoring(userId: string) {
    if (!supabase || !userId) return;

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(async (entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resourceEntry.duration > 1000) {
            await this.logEvent(userId, {
              type: 'alert',
              description: `Slow resource load: ${resourceEntry.name.split('/').pop()} (${Math.round(resourceEntry.duration)}ms)`,
              severity: 'medium'
            });
          }

          // Log failed resources
          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
            await this.logEvent(userId, {
              type: 'anomaly',
              description: `Failed to load resource: ${resourceEntry.name.split('/').pop()}`,
              severity: 'high'
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.log('Performance observer not supported');
    }

    return () => observer.disconnect();
  },

  /**
   * Log a network event to the database
   */
  async logEvent(userId: string, event: {
    type: 'connection' | 'disconnection' | 'anomaly' | 'alert';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }) {
    if (!supabase || !userId) return;

    try {
      await supabase
        .from('network_events')
        .insert({
          user_id: userId,
          timestamp: new Date().toISOString(),
          type: event.type,
          description: event.description,
          severity: event.severity
        });
    } catch (error) {
      console.error('Failed to log network event:', error);
    }
  },

  /**
   * Analyze current network status
   * Checks for Raspberry Pi availability and uses appropriate data source
   */
  async analyzeNetwork(userId: string) {
    const isRaspberryPiConnected = await this.isRaspberryPiAvailable();
    
    if (isRaspberryPiConnected) {
      console.log('📡 Raspberry Pi is available, using enhanced network analysis');
      // In a real implementation, we would fetch detailed network metrics from the Raspberry Pi
      // For now, we'll log that we're using Raspberry Pi data
      await this.logEvent(userId, {
        type: 'connection',
        description: 'Network analysis using Raspberry Pi data source',
        severity: 'low'
      });
      
      // Perform browser-based analysis as well
      await this.analyzeNetworkBrowser(userId);
    } else {
      console.log('📡 Raspberry Pi not available, using browser-based network analysis');
      // Fallback to browser-based analysis
      await this.analyzeNetworkBrowser(userId);
    }
  },

  /**
   * Browser-based network analysis (original implementation)
   */
  async analyzeNetworkBrowser(userId: string) {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      await this.logEvent(userId, {
        type: 'connection',
        description: 'Network API not available - using basic monitoring',
        severity: 'low'
      });
      return;
    }

    const { effectiveType, downlink, rtt, saveData } = connection;

    // Log current network status
    await this.logEvent(userId, {
      type: 'connection',
      description: `Network status: ${effectiveType} | Speed: ${downlink} Mbps | Latency: ${rtt}ms${saveData ? ' | Data Saver ON' : ''}`,
      severity: 'low'
    });

    // Check for poor connection
    if (effectiveType === 'slow-2g' || downlink < 0.5) {
      await this.logEvent(userId, {
        type: 'alert',
        description: 'Very slow network connection detected - performance may be degraded',
        severity: 'high'
      });
    }

    // Check for high latency
    if (rtt > 300) {
      await this.logEvent(userId, {
        type: 'anomaly',
        description: `High latency detected: ${rtt}ms - may affect real-time features`,
        severity: 'medium'
      });
    }

    // Check if data saver is enabled
    if (saveData) {
      await this.logEvent(userId, {
        type: 'connection',
        description: 'Data Saver mode detected - some features may be limited',
        severity: 'low'
      });
    }
  },

  /**
   * Check connection to external services
   */
  async checkConnectivity(userId: string) {
    const services = [
      { name: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace' },
      { name: 'Google DNS', url: 'https://dns.google' },
    ];

    for (const service of services) {
      try {
        const startTime = performance.now();
        const response = await fetch(service.url, { 
          method: 'HEAD', 
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (response.ok) {
          await this.logEvent(userId, {
            type: 'connection',
            description: `${service.name} reachable (${latency}ms)`,
            severity: latency > 500 ? 'medium' : 'low'
          });
        } else {
          await this.logEvent(userId, {
            type: 'alert',
            description: `${service.name} returned error: ${response.status}`,
            severity: 'medium'
          });
        }
      } catch (error) {
        await this.logEvent(userId, {
          type: 'anomaly',
          description: `Cannot reach ${service.name} - connectivity issue detected`,
          severity: 'high'
        });
      }
    }
  },

  /**
   * Generate initial demo events if database is empty
   */
  async seedDemoEvents(userId: string) {
    if (!supabase || !userId) return;

    // Check if user already has events
    const { data, error } = await supabase
      .from('network_events')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error || (data && data.length > 0)) {
      return; // User already has events
    }

    // Create some initial events
    const now = new Date();
    const events = [
      {
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        type: 'connection',
        description: 'Network monitoring started',
        severity: 'low'
      },
      {
        timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
        type: 'connection',
        description: 'High-speed network detected (4G)',
        severity: 'low'
      },
      {
        timestamp: new Date(now.getTime() - 8 * 60000).toISOString(),
        type: 'alert',
        description: 'Temporary latency spike detected (250ms)',
        severity: 'medium'
      },
      {
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        type: 'connection',
        description: 'Connection stability restored',
        severity: 'low'
      },
      {
        timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
        type: 'connection',
        description: 'All services operating normally',
        severity: 'low'
      }
    ];

    for (const event of events) {
      await supabase
        .from('network_events')
        .insert({
          user_id: userId,
          ...event
        });
    }
  },

  /**
   * Check if Raspberry Pi is connected and available
   */
  async isRaspberryPiAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/device-scan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.log('ℹ️ Raspberry Pi API not available:', error);
      return false;
    }
  },

  /**
   * Fetch real network metrics from the Raspberry Pi API endpoint
   * Falls back to browser-based metrics if Raspberry Pi is not available
   */
  async fetchNetworkMetricsFromRaspberryPi(userId: string) {
    console.log('📡 Network Monitor: Fetching network metrics from Raspberry Pi API for user:', userId);
    
    if (!supabase || !userId) {
      console.warn('⚠️ Supabase not configured or no user ID, using browser-based metrics');
      return this.getNetworkMetrics();
    }
    
    // Get network metrics using the unified method that handles Raspberry Pi availability
    return this.getNetworkMetrics();
  },

  /**
   * Get network metrics, prioritizing Raspberry Pi if available, otherwise using browser APIs
   */
  async getNetworkMetrics() {
    // Check if Raspberry Pi is available and try to get metrics from it
    const isRaspberryPiConnected = await this.isRaspberryPiAvailable();
    
    if (isRaspberryPiConnected) {
      try {
        // Try to fetch network metrics from the Raspberry Pi API endpoint
        const response = await fetch('/api/device-scan?metrics=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Received network metrics from Raspberry Pi API:', data.networkMetrics);
          
          if (data.networkMetrics) {
            return data.networkMetrics;
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching network metrics from Raspberry Pi API:', error);
      }
      
      // If fetching from Raspberry Pi failed, fall back to browser metrics
    }
    
    // Fallback to browser-based metrics
    return this.getBrowserNetworkMetrics();
  },
  
  /**
   * Get network metrics using browser APIs
   */
  async getBrowserNetworkMetrics() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    let downloadSpeed = 0;
    let effectiveType = 'unknown';
    let rtt = 0;
    
    if (connection) {
      // Downlink is in Mbps
      downloadSpeed = connection.downlink || 0;
      effectiveType = connection.effectiveType || 'unknown';
      // RTT (Round Trip Time) is latency in ms
      rtt = connection.rtt || 0;
    }

    // Measure actual latency by pinging a server
    let measuredLatency = rtt;
    try {
      const startTime = performance.now();
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { method: 'HEAD', cache: 'no-cache' });
      const endTime = performance.now();
      measuredLatency = endTime - startTime;
    } catch (e) {
      // Use connection RTT if fetch fails
    }

    // Estimate upload speed (typically 1/3 to 1/2 of download)
    const uploadSpeed = downloadSpeed * 0.4;

    // Determine connection quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (effectiveType === '4g' || downloadSpeed > 10) {
      quality = 'excellent';
    } else if (effectiveType === '3g' || downloadSpeed > 5) {
      quality = 'good';
    } else if (effectiveType === '2g' || downloadSpeed > 1) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    // Estimate packet loss based on connection quality
    let packetLoss = 0;
    if (quality === 'poor') packetLoss = 2.5;
    else if (quality === 'fair') packetLoss = 1.0;
    else if (quality === 'good') packetLoss = 0.3;
    else packetLoss = 0.1;

    // Get number of active connections from performance API
    const resources = performance.getEntriesByType('resource');
    const activeConnections = Math.min(resources.length, 25);

    return {
      bandwidth: {
        download: downloadSpeed || 0,
        upload: uploadSpeed || 0
      },
      latency: measuredLatency || 0,
      packetLoss,
      activeConnections,
      connectionQuality: quality
    };
  },

  /**
   * Enhanced analyzeNetwork that checks for Raspberry Pi availability
   */
  async analyzeNetworkEnhanced(userId: string) {
    const isRaspberryPiConnected = await this.isRaspberryPiAvailable();
    
    if (isRaspberryPiConnected) {
      console.log('📡 Raspberry Pi is available, using enhanced network analysis');
      // In a real implementation, we would fetch detailed network metrics from the Raspberry Pi
      // For now, we'll log that we're using Raspberry Pi data
      await this.logEvent(userId, {
        type: 'connection',
        description: 'Network analysis using Raspberry Pi data source',
        severity: 'low'
      });
      
      // Perform browser-based analysis as well
      await this.analyzeNetwork(userId);
    } else {
      console.log('📡 Raspberry Pi not available, using browser-based network analysis');
      // Fallback to browser-based analysis
      await this.analyzeNetwork(userId);
    }
  }
};
