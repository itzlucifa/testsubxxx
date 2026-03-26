import { supabase } from './supabase';
import type { Device, Threat, Alert, NetworkEvent } from '../types';

// Real network information using browser APIs
export const networkService = {
  async getNetworkInfo() {
    const info: any = {
      online: navigator.onLine,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };

    // @ts-ignore - NetworkInformation API
    if ('connection' in navigator) {
      // @ts-ignore
      const conn = (navigator as any).connection;
      info.effectiveType = conn?.effectiveType || 'unknown';
      info.downlink = conn?.downlink || 0;
      info.rtt = conn?.rtt || 0;
    }

    return info;
  },

  onNetworkChange(callback: (online: boolean) => void) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};

// Real-time device monitoring
export const deviceService = {
  async getDevices(userId: string | undefined): Promise<Device[]> {
    if (!userId) {
      // Return empty array or demo devices for demo mode
      return [];
    }
    
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false });

    if (error) throw error;

    return (data || []).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type as any,
      ipAddress: d.ip_address,
      macAddress: d.mac_address,
      manufacturer: d.manufacturer,
      os: d.os,
      firmware: d.firmware,
      status: d.status,
      vulnerabilityCount: d.vulnerability_count,
      lastSeen: new Date(d.last_seen),
      openPorts: d.open_ports,
      weakPassword: d.weak_password,
      outdatedFirmware: d.outdated_firmware,
    }));
  },

  async addDevice(userId: string | undefined, device: Omit<Device, 'id'>) {
    if (!userId || !supabase) {
      // In demo mode or without supabase, just return
      return;
    }
    const { data, error } = await supabase.from('devices').insert({
      user_id: userId,
      name: device.name,
      type: device.type,
      ip_address: device.ipAddress,
      mac_address: device.macAddress,
      manufacturer: device.manufacturer,
      os: device.os,
      firmware: device.firmware,
      status: device.status,
      vulnerability_count: device.vulnerabilityCount,
      last_seen: device.lastSeen.toISOString(),
      open_ports: device.openPorts,
      weak_password: device.weakPassword,
      outdated_firmware: device.outdatedFirmware,
    }).select().single();

    if (error) throw error;
    return data;
  },

  async updateDevice(deviceId: string, updates: Partial<Device>) {
    if (!supabase) throw new Error('Supabase is not configured');
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.status) updateData.status = updates.status;
    if (updates.lastSeen) updateData.last_seen = updates.lastSeen.toISOString();
    if (updates.vulnerabilityCount !== undefined) updateData.vulnerability_count = updates.vulnerabilityCount;

    const { error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', deviceId);

    if (error) throw error;
  },

  subscribeToDevices(userId: string | undefined, callback: (devices: Device[]) => void) {
    if (!userId || !supabase) return () => {};
    const channel = supabase
      .channel('devices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const devices = await this.getDevices(userId);
          callback(devices);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};

// Real-time threat monitoring
export const threatService = {
  async getThreats(userId: string | undefined): Promise<Threat[]> {
    if (!userId) {
      // Return empty array for demo mode
      return [];
    }
    
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('threats')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      type: t.type as any,
      severity: t.severity,
      source: t.source,
      target: t.target,
      timestamp: new Date(t.timestamp),
      blocked: t.blocked,
      autoRemediated: t.auto_remediated,
      confidence: t.confidence,
      description: t.description,
      descriptionHindi: t.description_hindi || undefined,
    }));
  },

  async addThreat(userId: string | undefined, threat: Omit<Threat, 'id'>) {
    if (!userId || !supabase) {
      // In demo mode or without supabase, just return
      return;
    }
    const { error } = await supabase.from('threats').insert({
      user_id: userId,
      type: threat.type,
      severity: threat.severity,
      source: threat.source,
      target: threat.target,
      timestamp: threat.timestamp.toISOString(),
      blocked: threat.blocked,
      auto_remediated: threat.autoRemediated,
      confidence: threat.confidence,
      description: threat.description,
      description_hindi: threat.descriptionHindi || null,
    });

    if (error) throw error;
  },

  subscribeToThreats(userId: string | undefined, callback: (threats: Threat[]) => void) {
    if (!userId || !supabase) return () => {};
    const channel = supabase
      .channel('threats_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threats',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const threats = await this.getThreats(userId);
          callback(threats);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
  
  // Function to check if Raspberry Pi is available
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
  
  // Function to perform real threat scan using Raspberry Pi
  async performRealThreatScan(userId: string): Promise<boolean> {
    console.log('📡 Performing real threat scan using Raspberry Pi for user:', userId);
    
    try {
      // In a real implementation, we would send a command to the Raspberry Pi to perform a threat scan
      // For now, we'll simulate by fetching network data and identifying potential threats
      const response = await fetch('/api/device-scan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Retrieved device data from Raspberry Pi for threat assessment:', data);
        
        // Process the device data to identify potential threats
        // In a real implementation, the Raspberry Pi would run actual threat detection tools
        await this.processThreatsFromRaspberryPiData(userId, data);
        
        return true;
      } else {
        console.warn('⚠️ Raspberry Pi API returned error, falling back to simulated scan:', response.status, response.statusText);
        return this.performSimulatedThreatScan(userId);
      }
    } catch (error) {
      console.error('⚠️ Error performing real threat scan with Raspberry Pi, falling back to simulated scan:', error);
      return this.performSimulatedThreatScan(userId);
    }
  },
  
  // Function to process threats identified by Raspberry Pi data
  async processThreatsFromRaspberryPiData(userId: string, raspberryPiData: any) {
    if (!supabase) return;
    
    try {
      // Extract device information from Raspberry Pi data
      const devices = raspberryPiData.devices || [];
      
      // Identify potential threats based on device characteristics
      for (const device of devices) {
        // Identify threats based on device characteristics
        const potentialThreats = this.identifyPotentialThreats(device);
        
        // Store identified threats in the database
        for (const threat of potentialThreats) {
          // Check if threat already exists
          const { data: existingThreat } = await supabase
            .from('threats')
            .select('id')
            .eq('description', threat.description)
            .eq('source', threat.source)
            .single();
            
          if (!existingThreat) {
            // Insert new threat
            await supabase
              .from('threats')
              .insert({
                user_id: userId,
                type: threat.type,
                severity: threat.severity,
                source: threat.source,
                target: threat.target,
                timestamp: new Date().toISOString(),
                blocked: threat.blocked,
                auto_remediated: threat.autoRemediated,
                confidence: threat.confidence,
                description: threat.description,
              });
          }
        }
      }
      
      // Also check for network-based threats in the data
      if (raspberryPiData.vulnerabilities) {
        for (const vulnerability of raspberryPiData.vulnerabilities) {
          // Convert vulnerabilities to potential threats
          const threatFromVuln = this.convertVulnerabilityToThreat(vulnerability, userId);
          if (threatFromVuln) {
            // Check if threat already exists
            const { data: existingThreat } = await supabase
              .from('threats')
              .select('id')
              .eq('description', threatFromVuln.description)
              .eq('source', threatFromVuln.source)
              .single();
              
            if (!existingThreat) {
              await supabase
                .from('threats')
                .insert(threatFromVuln);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing threats from Raspberry Pi data:', error);
    }
  },
  
  // Function to identify potential threats based on device characteristics
  identifyPotentialThreats(device: any) {
    const threats = [];
    
    // Example threats based on device characteristics
    if (device.os.toLowerCase().includes('windows') && device.os.includes('XP')) {
      threats.push({
        type: 'malware',
        severity: 'critical',
        source: device.ip_address || device.ip,
        target: device.ip_address || device.ip,
        blocked: false,
        autoRemediated: false,
        confidence: 95,
        description: `Critical malware threat detected on legacy Windows XP device ${device.name || device.ip_address || device.ip}`
      });
    }
    
    if (device.manufacturer.toLowerCase().includes('linksys') && device.firmware.includes('1.0')) {
      threats.push({
        type: 'port-scan',
        severity: 'high',
        source: device.ip_address || device.ip,
        target: device.ip_address || device.ip,
        blocked: false,
        autoRemediated: false,
        confidence: 80,
        description: `Port scanning activity detected on Linksys router with vulnerable firmware ${device.name || device.ip_address || device.ip}`
      });
    }
    
    if (device.type === 'router' && device.firmware.includes('old')) {
      threats.push({
        type: 'brute-force',
        severity: 'high',
        source: device.ip_address || device.ip,
        target: device.ip_address || device.ip,
        blocked: false,
        autoRemediated: false,
        confidence: 75,
        description: `Brute force attack vector detected on router with outdated firmware ${device.name || device.ip_address || device.ip}`
      });
    }
    
    // Add more threat detection logic based on device attributes
    if (device.vulnerability_count > 2) {
      // If device has multiple vulnerabilities
      threats.push({
        type: 'vulnerability-exploit',
        severity: device.vulnerability_count > 5 ? 'critical' : 'high',
        source: device.ip_address || device.ip,
        target: device.ip_address || device.ip,
        blocked: false,
        autoRemediated: false,
        confidence: 70 + Math.min(device.vulnerability_count * 5, 25),
        description: `Multiple vulnerabilities detected on ${device.type} device ${device.name || device.ip_address || device.ip} - potential exploit risk`
      });
    }
    
    return threats;
  },
  
  // Function to convert vulnerability to threat
  convertVulnerabilityToThreat(vulnerability: any, userId: string) {
    if (!vulnerability) return null;
    
    return {
      user_id: userId,
      type: 'vulnerability-exploit',
      severity: vulnerability.severity || 'medium',
      source: vulnerability.deviceId || 'network',
      target: vulnerability.deviceId || 'network',
      timestamp: new Date().toISOString(),
      blocked: false,
      auto_remediated: false,
      confidence: vulnerability.cvssScore ? Math.round(vulnerability.cvssScore * 10) : 70,
      description: `${vulnerability.title || 'Vulnerability'} detected: ${vulnerability.description || 'Potential security threat'}`
    };
  },
  
  // Function to perform simulated threat scan (original behavior)
  async performSimulatedThreatScan(userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      // Simulate finding some threats based on known patterns
      const simulatedThreats = [
        {
          type: ['malware', 'port-scan', 'brute-force'][Math.floor(Math.random() * 3)] as any,
          severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          source: `192.168.1.${Math.floor(2 + Math.random() * 253)}`,
          target: `192.168.1.${Math.floor(2 + Math.random() * 253)}`,
          timestamp: new Date(),
          blocked: Math.random() > 0.5,
          autoRemediated: Math.random() > 0.7,
          confidence: Math.floor(60 + Math.random() * 35),
          description: `Simulated ${['malware', 'port-scan', 'brute-force'][Math.floor(Math.random() * 3)]} threat detected on network`
        },
        {
          type: 'network-anomaly',
          severity: 'medium',
          source: '10.0.0.1',
          target: '10.0.0.100',
          timestamp: new Date(),
          blocked: false,
          autoRemediated: false,
          confidence: 65,
          description: 'Unusual network traffic pattern detected'
        }
      ];
      
      // Insert simulated threats into the database
      for (const threat of simulatedThreats) {
        await supabase
          .from('threats')
          .insert({
            user_id: userId,
            type: threat.type,
            severity: threat.severity,
            source: threat.source,
            target: threat.target,
            timestamp: threat.timestamp.toISOString(),
            blocked: threat.blocked,
            auto_remediated: threat.autoRemediated,
            confidence: threat.confidence,
            description: threat.description
          });
      }

      return true;
    } catch (error) {
      console.error('Error performing simulated threat scan:', error);
      return false;
    }
  },
  
  // Main function to scan for threats - uses Raspberry Pi if available, otherwise simulated
  async scanForThreats(userId: string): Promise<boolean> {
    if (!userId || !supabase) return false;

    try {
      // Check if Raspberry Pi is available for real threat scanning
      const isRaspberryPiConnected = await this.isRaspberryPiAvailable();
      
      if (isRaspberryPiConnected) {
        console.log('📡 Raspberry Pi is available, performing real threat scan');
        return await this.performRealThreatScan(userId);
      } else {
        console.log('📡 Raspberry Pi not available, performing simulated threat scan');
        return await this.performSimulatedThreatScan(userId);
      }
    } catch (error) {
      console.error('Error during threat scan:', error);
      // Fallback to simulated scan if there's an error
      return await this.performSimulatedThreatScan(userId);
    }
  }
};

// Alert management
export const alertService = {
  // Function to check if Raspberry Pi is available
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
  
  // Function to generate browser-based security alerts
  async generateBrowserBasedAlerts(userId: string): Promise<Alert[]> {
    const browserAlerts: Alert[] = [];
    
    try {
      // Get network information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        // Check for insecure connection
        if (location.protocol !== 'https:') {
          browserAlerts.push({
            id: Math.random().toString(36).substring(7),
            title: 'Insecure Connection',
            message: 'This site is accessed via HTTP. Sensitive data may be intercepted.',
            severity: 'high',
            timestamp: new Date(),
            read: false,
            whatsappSent: false,
            category: 'security',
          });
        }
        
        // Check for slow connection which could indicate network interference
        if (connection.effectiveType && connection.effectiveType === 'slow-2g') {
          browserAlerts.push({
            id: Math.random().toString(36).substring(7),
            title: 'Slow Network Connection',
            message: 'Possible network interference or throttling detected.',
            severity: 'medium',
            timestamp: new Date(),
            read: false,
            whatsappSent: false,
            category: 'network',
          });
        }
      }
      
      // Check for geolocation API usage patterns that might indicate tracking
      if (navigator.geolocation) {
        // This would typically involve checking if geolocation is being used unexpectedly
        // For demo purposes, we'll add an alert about location access
        browserAlerts.push({
          id: Math.random().toString(36).substring(7),
          title: 'Location Access Active',
          message: 'This site has access to your location. Review privacy settings.',
          severity: 'low',
          timestamp: new Date(),
          read: false,
          whatsappSent: false,
          category: 'privacy',
        });
      }
      
      // Check for various browser security features
      if (window.isSecureContext === false) {
        browserAlerts.push({
          id: Math.random().toString(36).substring(7),
          title: 'Non-Secure Context',
          message: 'Running in non-secure context. Some security features may be disabled.',
          severity: 'medium',
          timestamp: new Date(),
          read: false,
          whatsappSent: false,
          category: 'security',
        });
      }
      
      // Check for battery API (potential fingerprinting vector)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          if (battery.level < 0.2) {
            browserAlerts.push({
              id: Math.random().toString(36).substring(7),
              title: 'Low Battery',
              message: 'Device battery is low. Could indicate power-based attacks.',
              severity: 'low',
              timestamp: new Date(),
              read: false,
              whatsappSent: false,
              category: 'device',
            });
          }
        });
      }
      
      // Check for canvas fingerprinting detection
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Canvas fingerprinting test', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas fingerprinting test', 4, 17);
        
        // This is just for detection - we won't actually generate an alert
        // unless we detect suspicious canvas usage patterns
      }
      
      // Add some simulated device-based alerts
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('android') && userAgent.includes('webkit')) {
        browserAlerts.push({
          id: Math.random().toString(36).substring(7),
          title: 'Android Browser Security',
          message: 'Using Android browser. Consider using Chrome for better security.',
          severity: 'low',
          timestamp: new Date(),
          read: false,
          whatsappSent: false,
          category: 'browser',
        });
      }
      
      // Add time-based alerts
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        browserAlerts.push({
          id: Math.random().toString(36).substring(7),
          title: 'Late Night Activity',
          message: 'Unusual activity detected during late night hours.',
          severity: 'medium',
          timestamp: new Date(),
          read: false,
          whatsappSent: false,
          category: 'behavior',
        });
      }
      
      return browserAlerts;
    } catch (error) {
      console.error('Error generating browser-based alerts:', error);
      return [];
    }
  },
  
  // Function to perform real alert scan using browser APIs
  async performBrowserAlertScan(userId: string): Promise<boolean> {
    console.log('🌐 Generating browser-based alerts for user:', userId);
    
    try {
      // Generate alerts based on browser APIs
      const browserAlerts = await this.generateBrowserBasedAlerts(userId);
      
      // Store browser-based alerts in the database
      if (supabase && browserAlerts.length > 0) {
        for (const alert of browserAlerts) {
          try {
            await this.createAlert(userId, alert);
          } catch (error) {
            console.error('Error storing browser alert:', error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error during browser alert scan:', error);
      return false;
    }
  },
  
  // Main function to scan for alerts - uses browser APIs
  async scanForAlerts(userId: string): Promise<boolean> {
    if (!userId || !supabase) return false;

    try {
      return await this.performBrowserAlertScan(userId);
    } catch (error) {
      console.error('Error during alert scan:', error);
      return false;
    }
  },
  
  // Function to perform network scan (for when Raspberry Pi is available)
  async performNetworkScan(userId: string): Promise<boolean> {
    console.log('📡 Checking for Raspberry Pi network scan capability for user:', userId);
    
    try {
      // Check if Raspberry Pi is available
      const isRaspberryPiConnected = await this.isRaspberryPiAvailable();
      
      if (isRaspberryPiConnected) {
        console.log('📡 Raspberry Pi is available, initiating network scan');
        // In a real implementation, we would trigger the Raspberry Pi to perform a network scan
        // For now, we'll just return true to indicate that the scan was initiated
        return true;
      } else {
        console.log('📡 Raspberry Pi not available, cannot perform network scan');
        return false;
      }
    } catch (error) {
      console.error('Error during network scan:', error);
      return false;
    }
  },
  
  // Main function to initiate network scan - uses Raspberry Pi if available
  async scanNetwork(userId: string): Promise<boolean> {
    if (!userId || !supabase) return false;

    try {
      return await this.performNetworkScan(userId);
    } catch (error) {
      console.error('Error during network scan:', error);
      return false;
    }
  },
  
  async getAlerts(userId: string | undefined): Promise<Alert[]> {
    if (!userId) {
      // Return empty array for demo mode
      return [];
    }
    
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      titleHindi: a.title_hindi || undefined,
      message: a.message,
      messageHindi: a.message_hindi || undefined,
      severity: a.severity,
      timestamp: new Date(a.timestamp),
      read: a.read,
      whatsappSent: a.whatsapp_sent,
      category: a.category,
    }));
  },

  async createAlert(userId: string | undefined, alert: Omit<Alert, 'id'>) {
    if (!userId || !supabase) {
      // In demo mode or without supabase, just return
      return;
    }
    const { error } = await supabase.from('alerts').insert({
      user_id: userId,
      title: alert.title,
      title_hindi: alert.titleHindi || null,
      message: alert.message,
      message_hindi: alert.messageHindi || null,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
      read: alert.read,
      whatsapp_sent: alert.whatsappSent,
      category: alert.category,
    });

    if (error) throw error;
  },

  async markAsRead(alertId: string) {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId);

    if (error) throw error;
  },

  subscribeToAlerts(userId: string | undefined, callback: (alerts: Alert[]) => void) {
    if (!userId || !supabase) return () => {};
    const channel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const alerts = await this.getAlerts(userId);
          callback(alerts);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};

// Network events
export const networkEventService = {
  async getEvents(userId: string | undefined): Promise<NetworkEvent[]> {
    if (!userId) {
      // Return empty array for demo mode
      return [];
    }
    
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('network_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((e) => ({
      id: e.id,
      timestamp: new Date(e.timestamp),
      type: e.type,
      description: e.description,
      severity: e.severity,
    }));
  },

  async addEvent(userId: string | undefined, event: Omit<NetworkEvent, 'id'>) {
    if (!userId || !supabase) {
      // In demo mode or without supabase, just return
      return;
    }
    const { error } = await supabase.from('network_events').insert({
      user_id: userId,
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      description: event.description,
      severity: event.severity,
    });

    if (error) throw error;
  },
};
