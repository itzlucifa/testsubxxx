import { useEffect, useState } from 'react';
import { deviceService } from '../lib/real-time-services';
import type { Device } from '../types';

export function useRealTimeDevices(userId: string | undefined) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no userId, use demo devices
    if (!userId) {
      console.log('🏠 useRealTimeDevices: No user ID - using demo devices');
      
      // Create more realistic demo devices based on current browser environment
      const currentDeviceInfo = {
        name: `Your ${typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Computer'}`,
        type: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'phone' : 'computer',
        os: typeof navigator !== 'undefined' ? 
          (navigator.userAgent.includes('Win') ? 'Windows' : 
           navigator.userAgent.includes('Mac') ? 'macOS' : 
           navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown') : 'Unknown',
      };
      
      // Get local IP if available
      const localIPs = typeof window !== 'undefined' ? 
        (window as any).RTCPeerConnection ? [] : [] : [];
      
      // Create demo devices
      const demoDevices: Device[] = [
        {
          id: 'demo-current-device',
          name: currentDeviceInfo.name,
          type: currentDeviceInfo.type as any,
          ipAddress: '192.168.1.100',
          macAddress: '00:11:22:33:44:55',
          manufacturer: 'Browser Detected',
          os: currentDeviceInfo.os,
          firmware: 'N/A',
          status: 'safe',
          vulnerabilityCount: 0,
          lastSeen: new Date(),
          openPorts: [80, 443, 3000],
          weakPassword: false,
          outdatedFirmware: false,
        },
        {
          id: 'demo-router',
          name: 'Network Gateway/Router',
          type: 'router',
          ipAddress: '192.168.1.1',
          macAddress: '00:11:22:33:44:01',
          manufacturer: 'Router Manufacturer',
          os: 'Router OS',
          firmware: 'v2.1.0',
          status: 'safe',
          vulnerabilityCount: 0,
          lastSeen: new Date(),
          openPorts: [22, 80, 443],
          weakPassword: false,
          outdatedFirmware: false,
        },
        {
          id: 'demo-smartphone',
          name: 'Smartphone',
          type: 'phone',
          ipAddress: '192.168.1.101',
          macAddress: '00:11:22:33:44:02',
          manufacturer: 'Samsung',
          os: 'Android 14',
          firmware: 'v14.0',
          status: 'warning',
          vulnerabilityCount: 2,
          lastSeen: new Date(),
          openPorts: [5555, 8080],
          weakPassword: true,
          outdatedFirmware: true,
        },
        {
          id: 'demo-printer',
          name: 'Network Printer',
          type: 'printer',
          ipAddress: '192.168.1.102',
          macAddress: '00:11:22:33:44:03',
          manufacturer: 'HP',
          os: 'Embedded',
          firmware: 'v3.5.1',
          status: 'warning',
          vulnerabilityCount: 1,
          lastSeen: new Date(),
          openPorts: [9100, 515, 631],
          weakPassword: false,
          outdatedFirmware: true,
        }
      ];
      
      setDevices(demoDevices);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Use Supabase for real-time devices
    deviceService
      .getDevices(userId)
      .then((data) => {
        if (mounted) {
          setDevices(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    const unsubscribe = deviceService.subscribeToDevices(userId, (updatedDevices) => {
      if (mounted) {
        setDevices(updatedDevices);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const addDevice = async (device: Omit<Device, 'id'>) => {
    if (!userId) {
      // In demo mode, just add to local state
      const newDevice = {
        ...device,
        id: `demo-${Date.now()}`,
      };
      setDevices(prev => [...prev, newDevice]);
      return;
    }
    await deviceService.addDevice(userId, device);
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    if (!userId) {
      // In demo mode, just update local state
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? { ...device, ...updates } : device
      ));
      return;
    }
    await deviceService.updateDevice(deviceId, updates);
  };

  return { devices, loading, error, addDevice, updateDevice };
}
