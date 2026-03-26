import type { ActionFunctionArgs } from "react-router";
import { executeSecurityAction, type ActionConfig } from "../lib/security-integrations";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { actionType, target, provider } = body as ActionConfig;

    if (!actionType || !target) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: actionType and target' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKeys: Record<string, string> = {
      VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY || '',
      ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY || '',
      ALIENVAULT_OTX_API_KEY: process.env.ALIENVAULT_OTX_API_KEY || '',
      HIBP_API_KEY: process.env.HIBP_API_KEY || '',
    };

    const result = await executeSecurityAction({ actionType, target, provider }, apiKeys);

    return new Response(JSON.stringify({ 
      success: result.success,
      verdict: result.verdict,
      score: result.score,
      details: result.details,
      indicators: result.indicators,
      provider: result.provider,
      error: result.error,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Security action error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function loader() {
  const integrations = [
    { provider: 'VirusTotal', configured: !!process.env.VIRUSTOTAL_API_KEY, actions: ['scan_url', 'scan_file'] },
    { provider: 'AbuseIPDB', configured: !!process.env.ABUSEIPDB_API_KEY, actions: ['check_ip'] },
    { provider: 'AlienVault OTX', configured: !!process.env.ALIENVAULT_OTX_API_KEY, actions: ['check_ip', 'check_domain', 'threat_intel_lookup'] },
    { provider: 'Have I Been Pwned', configured: !!process.env.HIBP_API_KEY, actions: ['check_email_breach'] },
  ];

  return new Response(JSON.stringify({ integrations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
