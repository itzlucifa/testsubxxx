import type { IntegrationResult, ActionType } from './security-integrations';

export interface SecurityActionRequest {
  actionType: ActionType;
  target: string;
  provider?: 'virustotal' | 'abuseipdb' | 'alienvault' | 'hibp';
}

export interface SecurityActionResponse {
  success: boolean;
  result?: IntegrationResult;
  error?: string;
}

export interface IntegrationInfo {
  provider: string;
  configured: boolean;
  actions: string[];
}

export async function executeSecurityActionClient(action: SecurityActionRequest): Promise<SecurityActionResponse> {
  try {
    const response = await fetch('/api/security-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getConfiguredIntegrations(): Promise<IntegrationInfo[]> {
  try {
    const response = await fetch('/api/security-action');
    const data = await response.json();
    return data.integrations || [];
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return [];
  }
}

export async function scanUrl(url: string): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ actionType: 'scan_url', target: url });
}

export async function scanFileHash(hash: string): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ actionType: 'scan_file', target: hash });
}

export async function checkIP(ip: string, useAlienVault = false): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ 
    actionType: 'check_ip', 
    target: ip,
    provider: useAlienVault ? 'alienvault' : 'abuseipdb'
  });
}

export async function checkDomain(domain: string): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ actionType: 'check_domain', target: domain });
}

export async function checkEmailBreach(email: string): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ actionType: 'check_email_breach', target: email });
}

export async function threatIntelLookup(indicator: string): Promise<SecurityActionResponse> {
  return executeSecurityActionClient({ actionType: 'threat_intel_lookup', target: indicator });
}
