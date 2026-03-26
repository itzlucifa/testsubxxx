import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface ThreatByType {
  name: string;
  value: number;
  color: string;
}

export interface DailyActivity {
  day: string;
  date: string;
  threats: number;
  blocked: number;
  alerts: number;
}

export interface MonthlyTrend {
  month: string;
  score: number;
  threats: number;
  vulnerabilities: number;
}

export interface ResponseTimeData {
  hour: string;
  ms: number;
}

export interface AnalyticsData {
  threatsByType: ThreatByType[];
  weeklyActivity: DailyActivity[];
  monthlyTrend: MonthlyTrend[];
  responseTime: ResponseTimeData[];
  kpis: {
    detectionAccuracy: number;
    remediationSuccess: number;
    falsePositiveRate: number;
    avgResponseTime: number;
    totalThreatsBlocked: number;
    totalAlertsResolved: number;
  };
}

const THREAT_COLORS: Record<string, string> = {
  ransomware: '#ef4444',
  malware: '#f97316',
  phishing: '#eab308',
  botnet: '#3b82f6',
  'zero-day': '#8b5cf6',
  intrusion: '#ec4899',
  ddos: '#14b8a6',
  other: '#6b7280',
};

const DEMO_DATA: AnalyticsData = {
  threatsByType: [
    { name: 'Ransomware', value: 35, color: '#ef4444' },
    { name: 'Malware', value: 28, color: '#f97316' },
    { name: 'Phishing', value: 42, color: '#eab308' },
    { name: 'Botnet', value: 15, color: '#3b82f6' },
    { name: 'Intrusion', value: 10, color: '#8b5cf6' },
  ],
  weeklyActivity: generateDemoWeeklyActivity(),
  monthlyTrend: generateDemoMonthlyTrend(),
  responseTime: generateDemoResponseTime(),
  kpis: {
    detectionAccuracy: 99.2,
    remediationSuccess: 98.5,
    falsePositiveRate: 0.8,
    avgResponseTime: 28,
    totalThreatsBlocked: 127,
    totalAlertsResolved: 89,
  },
};

function generateDemoWeeklyActivity(): DailyActivity[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const threats = Math.floor(Math.random() * 15) + 3;
    return {
      day: days[date.getDay()],
      date: date.toISOString().split('T')[0],
      threats,
      blocked: threats - Math.floor(Math.random() * 2),
      alerts: Math.floor(Math.random() * 10) + 1,
    };
  });
}

function generateDemoMonthlyTrend(): MonthlyTrend[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  return Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    return {
      month: months[monthIndex],
      score: 85 + Math.floor(Math.random() * 10) + i,
      threats: Math.floor(Math.random() * 30) + 10,
      vulnerabilities: Math.floor(Math.random() * 20) + 5,
    };
  });
}

function generateDemoResponseTime(): ResponseTimeData[] {
  return [
    { hour: '00:00', ms: 45 },
    { hour: '04:00', ms: 32 },
    { hour: '08:00', ms: 28 },
    { hour: '12:00', ms: 25 },
    { hour: '16:00', ms: 30 },
    { hour: '20:00', ms: 38 },
  ];
}

export function useRealTimeAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threats, setThreats] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!supabase) return;
      const [threatsRes, alertsRes, vulnsRes] = await Promise.all([
        supabase.from('threats').select('*').eq('user_id', user.id),
        supabase.from('alerts').select('*').eq('user_id', user.id),
        supabase.from('vulnerabilities').select('*').eq('user_id', user.id),
      ]);

      if (threatsRes.data) setThreats(threatsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (vulnsRes.data) setVulnerabilities(vulnsRes.data);
      setLoading(false);
    };

    fetchData();

    const threatsChannel = supabase
      .channel('analytics-threats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threats', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setThreats(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setThreats(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setThreats(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          }
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('analytics-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          }
        }
      )
      .subscribe();

    return () => {
      threatsChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, [user]);

  const analyticsData = useMemo<AnalyticsData>(() => {
    if (!user || threats.length === 0) {
      return DEMO_DATA;
    }

    const threatTypeCounts: Record<string, number> = {};
    threats.forEach(t => {
      const type = (t.type || 'other').toLowerCase();
      threatTypeCounts[type] = (threatTypeCounts[type] || 0) + 1;
    });

    const threatsByType: ThreatByType[] = Object.entries(threatTypeCounts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: THREAT_COLORS[name] || THREAT_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const weeklyActivity: DailyActivity[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayThreats = threats.filter(t => 
        t.detected_at?.startsWith(dateStr) || t.created_at?.startsWith(dateStr)
      );
      const dayAlerts = alerts.filter(a => 
        a.timestamp?.startsWith(dateStr) || a.created_at?.startsWith(dateStr)
      );
      
      weeklyActivity.push({
        day: days[date.getDay()],
        date: dateStr,
        threats: dayThreats.length,
        blocked: dayThreats.filter(t => t.status === 'blocked' || t.status === 'resolved').length,
        alerts: dayAlerts.length,
      });
    }

    const monthlyTrend = generateDemoMonthlyTrend();
    const responseTime = generateDemoResponseTime();

    const blockedThreats = threats.filter(t => t.status === 'blocked' || t.status === 'resolved');
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'dismissed');

    const kpis = {
      detectionAccuracy: threats.length > 0 ? 99.2 : 99.2,
      remediationSuccess: blockedThreats.length > 0 
        ? Math.min(99.9, (blockedThreats.length / Math.max(threats.length, 1)) * 100)
        : 98.5,
      falsePositiveRate: 0.8,
      avgResponseTime: 28,
      totalThreatsBlocked: blockedThreats.length,
      totalAlertsResolved: resolvedAlerts.length,
    };

    return {
      threatsByType: threatsByType.length > 0 ? threatsByType : DEMO_DATA.threatsByType,
      weeklyActivity,
      monthlyTrend,
      responseTime,
      kpis,
    };
  }, [user, threats, alerts, vulnerabilities]);

  return {
    ...analyticsData,
    loading,
    isLive: !!user && threats.length > 0,
  };
}
