import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: 'admin' | 'user' | 'viewer';
          subscription: 'free' | 'professional' | 'enterprise';
          mfa_enabled: boolean;
          created_at: string;
          last_login: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          ip_address: string;
          mac_address: string;
          manufacturer: string;
          os: string;
          firmware: string;
          status: 'safe' | 'warning' | 'critical';
          vulnerability_count: number;
          last_seen: string;
          open_ports: number[];
          weak_password: boolean;
          outdated_firmware: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
      };
      threats: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          source: string;
          target: string;
          timestamp: string;
          blocked: boolean;
          auto_remediated: boolean;
          confidence: number;
          description: string;
          description_hindi: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['threats']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['threats']['Insert']>;
      };
      vulnerabilities: {
        Row: {
          id: string;
          user_id: string;
          cve_id: string;
          title: string;
          description: string;
          cvss_score: number;
          severity: 'critical' | 'high' | 'medium' | 'low';
          status: 'open' | 'patching' | 'patched';
          affected_devices: string[];
          discovered_at: string;
          patch_available: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vulnerabilities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['vulnerabilities']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          title_hindi: string | null;
          message: string;
          message_hindi: string | null;
          severity: 'critical' | 'high' | 'medium' | 'low';
          timestamp: string;
          read: boolean;
          whatsapp_sent: boolean;
          category: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      network_events: {
        Row: {
          id: string;
          user_id: string;
          timestamp: string;
          type: 'connection' | 'disconnection' | 'anomaly' | 'alert';
          description: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['network_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['network_events']['Insert']>;
      };
      security_settings: {
        Row: {
          id: string;
          user_id: string;
          auto_remediation: boolean;
          deepfake_detection: boolean;
          post_quantum_crypto: boolean;
          language: 'en' | 'hi';
          email_notifications: boolean;
          whatsapp_notifications: boolean;
          sms_notifications: boolean;
          push_notifications: boolean;
          zero_trust_enabled: boolean;
          continuous_auth: boolean;
          micro_segmentation: boolean;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['security_settings']['Insert']>;
      };
      soar_playbooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          trigger: 'manual' | 'automatic' | 'scheduled';
          enabled: boolean;
          execution_count: number;
          success_rate: number;
          avg_response_time: number;
          last_run: string | null;
          steps: any[];
          trigger_conditions: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['soar_playbooks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['soar_playbooks']['Insert']>;
      };
      soar_executions: {
        Row: {
          id: string;
          playbook_id: string;
          user_id: string;
          status: 'running' | 'completed' | 'failed' | 'cancelled';
          started_at: string;
          completed_at: string | null;
          trigger_source: string | null;
          triggered_by_threat_id: string | null;
          execution_log: any[];
          actions_taken: any[];
          success: boolean | null;
          error_message: string | null;
          response_time_ms: number | null;
        };
        Insert: Omit<Database['public']['Tables']['soar_executions']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['soar_executions']['Insert']>;
      };
      soar_actions: {
        Row: {
          id: string;
          execution_id: string;
          action_type: string;
          action_data: any;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
          started_at: string | null;
          completed_at: string | null;
          result: any;
          error_message: string | null;
        };
        Insert: Omit<Database['public']['Tables']['soar_actions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['soar_actions']['Insert']>;
      };
    };
  };
};
