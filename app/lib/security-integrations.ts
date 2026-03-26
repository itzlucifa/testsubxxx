export interface IntegrationResult {
  provider: string;
  success: boolean;
  verdict?: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  score?: number;
  details: string;
  indicators?: Record<string, any>;
  raw?: any;
  error?: string;
  cached?: boolean;
}

export interface IntegrationConfig {
  apiKey?: string;
  enabled: boolean;
}

const CACHE_DURATION_MS = 3600000;
const resultCache = new Map<string, { result: IntegrationResult; timestamp: number }>();

function getCached(key: string): IntegrationResult | null {
  const cached = resultCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return { ...cached.result, cached: true };
  }
  return null;
}

function setCache(key: string, result: IntegrationResult): void {
  resultCache.set(key, { result, timestamp: Date.now() });
}

export const virusTotalIntegration = {
  name: 'VirusTotal',
  
  async scanUrl(url: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `vt:url:${url}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://www.virustotal.com/vtapi/v2/url/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `apikey=${apiKey}&resource=${encodeURIComponent(url)}`,
      });

      if (response.status === 429) {
        return { provider: 'VirusTotal', success: false, details: 'Rate limit exceeded', error: 'rate_limited' };
      }

      const data = await response.json();
      
      if (data.response_code === 0) {
        const result: IntegrationResult = {
          provider: 'VirusTotal',
          success: true,
          verdict: 'unknown',
          details: 'URL not found in database',
        };
        setCache(cacheKey, result);
        return result;
      }

      const positives = data.positives || 0;
      const total = data.total || 0;
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      
      if (positives > 5) verdict = 'malicious';
      else if (positives > 0) verdict = 'suspicious';

      const result: IntegrationResult = {
        provider: 'VirusTotal',
        success: true,
        verdict,
        score: total > 0 ? (positives / total) * 100 : 0,
        details: `${positives}/${total} security vendors flagged this URL`,
        indicators: { positives, total, scanDate: data.scan_date },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'VirusTotal', 
        success: false, 
        details: 'Failed to scan URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async scanFileHash(hash: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `vt:hash:${hash}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://www.virustotal.com/vtapi/v2/file/report?apikey=${apiKey}&resource=${hash}`);

      if (response.status === 429) {
        return { provider: 'VirusTotal', success: false, details: 'Rate limit exceeded', error: 'rate_limited' };
      }

      const data = await response.json();
      
      if (data.response_code === 0) {
        const result: IntegrationResult = {
          provider: 'VirusTotal',
          success: true,
          verdict: 'unknown',
          details: 'File hash not found in database',
        };
        setCache(cacheKey, result);
        return result;
      }

      const positives = data.positives || 0;
      const total = data.total || 0;
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      
      if (positives > 5) verdict = 'malicious';
      else if (positives > 0) verdict = 'suspicious';

      const result: IntegrationResult = {
        provider: 'VirusTotal',
        success: true,
        verdict,
        score: total > 0 ? (positives / total) * 100 : 0,
        details: `${positives}/${total} security vendors detected this file as malicious`,
        indicators: { positives, total, scanDate: data.scan_date, sha256: data.sha256 },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'VirusTotal', 
        success: false, 
        details: 'Failed to scan file hash',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const abuseIPDBIntegration = {
  name: 'AbuseIPDB',

  async checkIP(ip: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `abuseipdb:${ip}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
        headers: {
          'Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        return { provider: 'AbuseIPDB', success: false, details: 'Rate limit exceeded', error: 'rate_limited' };
      }

      if (!response.ok) {
        return { provider: 'AbuseIPDB', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const ipData = data.data;
      
      const abuseScore = ipData.abuseConfidenceScore || 0;
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      
      if (abuseScore > 75) verdict = 'malicious';
      else if (abuseScore > 25) verdict = 'suspicious';

      const result: IntegrationResult = {
        provider: 'AbuseIPDB',
        success: true,
        verdict,
        score: abuseScore,
        details: `Abuse confidence score: ${abuseScore}% (${ipData.totalReports || 0} reports)`,
        indicators: {
          abuseScore,
          totalReports: ipData.totalReports,
          countryCode: ipData.countryCode,
          isp: ipData.isp,
          domain: ipData.domain,
          isTor: ipData.isTor,
          isWhitelisted: ipData.isWhitelisted,
        },
        raw: ipData,
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'AbuseIPDB', 
        success: false, 
        details: 'Failed to check IP',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const alienVaultOTXIntegration = {
  name: 'AlienVault OTX',

  async getIndicator(type: 'IPv4' | 'domain' | 'hostname' | 'url' | 'FileHash-SHA256', indicator: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `otx:${type}:${indicator}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const section = type === 'IPv4' ? 'general' : 'general';
      const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/${type}/${encodeURIComponent(indicator)}/${section}`, {
        headers: {
          'X-OTX-API-KEY': apiKey,
        },
      });

      if (response.status === 429) {
        return { provider: 'AlienVault OTX', success: false, details: 'Rate limit exceeded', error: 'rate_limited' };
      }

      if (response.status === 404) {
        const result: IntegrationResult = {
          provider: 'AlienVault OTX',
          success: true,
          verdict: 'unknown',
          details: 'Indicator not found in threat intelligence database',
        };
        setCache(cacheKey, result);
        return result;
      }

      if (!response.ok) {
        return { provider: 'AlienVault OTX', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const pulseCount = data.pulse_info?.count || 0;
      
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      if (pulseCount > 10) verdict = 'malicious';
      else if (pulseCount > 0) verdict = 'suspicious';

      const result: IntegrationResult = {
        provider: 'AlienVault OTX',
        success: true,
        verdict,
        score: Math.min(pulseCount * 10, 100),
        details: `Found in ${pulseCount} threat intelligence pulses`,
        indicators: {
          pulseCount,
          reputation: data.reputation,
          country: data.country_name,
          asn: data.asn,
        },
        raw: data,
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'AlienVault OTX', 
        success: false, 
        details: 'Failed to query threat intelligence',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async checkIP(ip: string, apiKey: string): Promise<IntegrationResult> {
    return this.getIndicator('IPv4', ip, apiKey);
  },

  async checkDomain(domain: string, apiKey: string): Promise<IntegrationResult> {
    return this.getIndicator('domain', domain, apiKey);
  },
};

export const hibpIntegration = {
  name: 'Have I Been Pwned',

  async checkEmail(email: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `hibp:${email}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'CyberShield-SOAR',
        },
      });

      if (response.status === 429) {
        return { provider: 'Have I Been Pwned', success: false, details: 'Rate limit exceeded', error: 'rate_limited' };
      }

      if (response.status === 404) {
        const result: IntegrationResult = {
          provider: 'Have I Been Pwned',
          success: true,
          verdict: 'clean',
          score: 0,
          details: 'No breaches found for this email',
        };
        setCache(cacheKey, result);
        return result;
      }

      if (!response.ok) {
        return { provider: 'Have I Been Pwned', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const breaches = await response.json();
      const breachCount = breaches.length;
      
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'suspicious';
      if (breachCount > 5) verdict = 'malicious';

      const result: IntegrationResult = {
        provider: 'Have I Been Pwned',
        success: true,
        verdict,
        score: Math.min(breachCount * 10, 100),
        details: `Email found in ${breachCount} data breach(es)`,
        indicators: {
          breachCount,
          breaches: breaches.map((b: any) => ({
            name: b.Name,
            domain: b.Domain,
            breachDate: b.BreachDate,
            dataClasses: b.DataClasses,
          })),
        },
        raw: breaches,
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'Have I Been Pwned', 
        success: false, 
        details: 'Failed to check email breaches',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async checkPassword(sha1Prefix: string): Promise<IntegrationResult> {
    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${sha1Prefix}`);
      
      if (!response.ok) {
        return { provider: 'Have I Been Pwned', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      return {
        provider: 'Have I Been Pwned',
        success: true,
        verdict: 'unknown',
        details: `Password range check completed (${lines.length} hashes returned)`,
        indicators: { hashCount: lines.length },
      };
    } catch (error) {
      return { 
        provider: 'Have I Been Pwned', 
        success: false, 
        details: 'Failed to check password',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const urlhausIntegration = {
  name: 'URLhaus',

  async checkUrl(url: string): Promise<IntegrationResult> {
    const cacheKey = `urlhaus:${url}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(url)}`,
      });

      if (!response.ok) {
        return { provider: 'URLhaus', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.query_status === 'no_results') {
        const result: IntegrationResult = {
          provider: 'URLhaus',
          success: true,
          verdict: 'clean',
          score: 0,
          details: 'URL not found in malware database - appears safe',
        };
        setCache(cacheKey, result);
        return result;
      }

      const result: IntegrationResult = {
        provider: 'URLhaus',
        success: true,
        verdict: 'malicious',
        score: 100,
        details: `Malware URL detected! Threat: ${data.threat || 'unknown'}, Status: ${data.url_status || 'unknown'}`,
        indicators: {
          threat: data.threat,
          urlStatus: data.url_status,
          dateAdded: data.date_added,
          tags: data.tags,
        },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'URLhaus', 
        success: false, 
        details: 'Failed to check URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const malwareBazaarIntegration = {
  name: 'MalwareBazaar',

  async checkHash(hash: string): Promise<IntegrationResult> {
    const cacheKey = `malwarebazaar:${hash}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `query=get_info&hash=${encodeURIComponent(hash)}`,
      });

      if (!response.ok) {
        return { provider: 'MalwareBazaar', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.query_status === 'hash_not_found' || data.query_status === 'no_results') {
        const result: IntegrationResult = {
          provider: 'MalwareBazaar',
          success: true,
          verdict: 'clean',
          score: 0,
          details: 'File hash not found in malware database - appears safe',
        };
        setCache(cacheKey, result);
        return result;
      }

      const malware = data.data?.[0];
      const result: IntegrationResult = {
        provider: 'MalwareBazaar',
        success: true,
        verdict: 'malicious',
        score: 100,
        details: `Known malware detected! Family: ${malware?.signature || 'unknown'}, Type: ${malware?.file_type || 'unknown'}`,
        indicators: {
          signature: malware?.signature,
          fileType: malware?.file_type,
          fileName: malware?.file_name,
          firstSeen: malware?.first_seen,
          tags: malware?.tags,
        },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'MalwareBazaar', 
        success: false, 
        details: 'Failed to check file hash',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const phishtankIntegration = {
  name: 'PhishTank',

  async checkUrl(url: string): Promise<IntegrationResult> {
    const cacheKey = `phishtank:${url}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://checkurl.phishtank.com/checkurl/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(url)}&format=json`,
      });

      if (!response.ok) {
        return { provider: 'PhishTank', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (!data.results?.in_database) {
        const result: IntegrationResult = {
          provider: 'PhishTank',
          success: true,
          verdict: 'unknown',
          score: 0,
          details: 'URL not found in PhishTank database',
        };
        setCache(cacheKey, result);
        return result;
      }

      if (data.results?.valid) {
        const result: IntegrationResult = {
          provider: 'PhishTank',
          success: true,
          verdict: 'malicious',
          score: 100,
          details: 'Confirmed phishing site! Do not visit this URL.',
          indicators: {
            phishId: data.results?.phish_id,
            verified: data.results?.verified,
            verifiedAt: data.results?.verified_at,
          },
          raw: data,
        };
        setCache(cacheKey, result);
        return result;
      }

      const result: IntegrationResult = {
        provider: 'PhishTank',
        success: true,
        verdict: 'suspicious',
        score: 50,
        details: 'URL found in database but not yet verified as phishing',
        indicators: { phishId: data.results?.phish_id },
        raw: data,
      };
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'PhishTank', 
        success: false, 
        details: 'Failed to check URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const shodanIntegration = {
  name: 'Shodan',

  async checkIP(ip: string, apiKey: string): Promise<IntegrationResult> {
    const cacheKey = `shodan:${ip}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);

      if (response.status === 404) {
        const result: IntegrationResult = {
          provider: 'Shodan',
          success: true,
          verdict: 'clean',
          score: 0,
          details: 'No exposed services found for this IP',
        };
        setCache(cacheKey, result);
        return result;
      }

      if (response.status === 401) {
        return { provider: 'Shodan', success: false, details: 'Invalid API key', error: 'invalid_key' };
      }

      if (!response.ok) {
        return { provider: 'Shodan', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const openPorts = data.ports || [];
      const vulns = data.vulns || [];
      
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      let score = 0;
      
      if (vulns.length > 0) {
        verdict = 'malicious';
        score = Math.min(vulns.length * 20, 100);
      } else if (openPorts.length > 5) {
        verdict = 'suspicious';
        score = Math.min(openPorts.length * 5, 50);
      }

      const result: IntegrationResult = {
        provider: 'Shodan',
        success: true,
        verdict,
        score,
        details: `Found ${openPorts.length} open ports${vulns.length > 0 ? ` and ${vulns.length} known vulnerabilities` : ''}`,
        indicators: {
          openPorts,
          vulnerabilities: vulns,
          hostnames: data.hostnames,
          org: data.org,
          isp: data.isp,
          country: data.country_name,
          lastUpdate: data.last_update,
        },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'Shodan', 
        success: false, 
        details: 'Failed to check IP',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const greynoiseIntegration = {
  name: 'GreyNoise',

  async checkIP(ip: string, apiKey?: string): Promise<IntegrationResult> {
    const cacheKey = `greynoise:${ip}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) {
        headers['key'] = apiKey;
      }

      const response = await fetch(`https://api.greynoise.io/v3/community/${ip}`, { headers });

      if (response.status === 404) {
        const result: IntegrationResult = {
          provider: 'GreyNoise',
          success: true,
          verdict: 'clean',
          score: 0,
          details: 'IP not seen scanning the internet - appears safe',
        };
        setCache(cacheKey, result);
        return result;
      }

      if (!response.ok) {
        return { provider: 'GreyNoise', success: false, details: 'API request failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      let score = 0;
      
      if (data.classification === 'malicious') {
        verdict = 'malicious';
        score = 100;
      } else if (data.classification === 'unknown' && data.noise) {
        verdict = 'suspicious';
        score = 50;
      } else if (data.riot) {
        verdict = 'clean';
        score = 0;
      }

      const result: IntegrationResult = {
        provider: 'GreyNoise',
        success: true,
        verdict,
        score,
        details: data.noise 
          ? `IP is a known internet scanner. Classification: ${data.classification || 'unknown'}`
          : data.riot 
            ? 'IP belongs to a known benign service (CDN, cloud provider, etc.)'
            : 'IP not observed in internet-wide scans',
        indicators: {
          noise: data.noise,
          riot: data.riot,
          classification: data.classification,
          name: data.name,
          lastSeen: data.last_seen,
        },
        raw: data,
      };
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      return { 
        provider: 'GreyNoise', 
        success: false, 
        details: 'Failed to check IP',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export interface SecurityIntegrations {
  virustotal: typeof virusTotalIntegration;
  abuseipdb: typeof abuseIPDBIntegration;
  alienvault: typeof alienVaultOTXIntegration;
  hibp: typeof hibpIntegration;
  urlhaus: typeof urlhausIntegration;
  malwarebazaar: typeof malwareBazaarIntegration;
  phishtank: typeof phishtankIntegration;
  shodan: typeof shodanIntegration;
  greynoise: typeof greynoiseIntegration;
}

export const securityIntegrations: SecurityIntegrations = {
  virustotal: virusTotalIntegration,
  abuseipdb: abuseIPDBIntegration,
  alienvault: alienVaultOTXIntegration,
  hibp: hibpIntegration,
  urlhaus: urlhausIntegration,
  malwarebazaar: malwareBazaarIntegration,
  phishtank: phishtankIntegration,
  shodan: shodanIntegration,
  greynoise: greynoiseIntegration,
};

export type ActionType = 
  | 'scan_url'
  | 'scan_file'
  | 'check_ip'
  | 'check_domain'
  | 'check_email_breach'
  | 'check_password_breach'
  | 'threat_intel_lookup'
  | 'check_malware_url'
  | 'check_malware_hash'
  | 'check_phishing'
  | 'check_exposed_services'
  | 'check_scanner_ip';

export interface ActionConfig {
  actionType: ActionType;
  target: string;
  provider?: 'virustotal' | 'abuseipdb' | 'alienvault' | 'hibp' | 'urlhaus' | 'malwarebazaar' | 'phishtank' | 'shodan' | 'greynoise';
}

async function sha1Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkPasswordBreach(password: string): Promise<IntegrationResult> {
  try {
    const sha1 = await sha1Hash(password);
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    if (!response.ok) {
      return { 
        provider: 'Have I Been Pwned', 
        success: false, 
        details: 'API request failed', 
        error: `HTTP ${response.status}` 
      };
    }

    const text = await response.text();
    const lines = text.split('\r\n');
    
    let breachCount = 0;
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        breachCount = parseInt(count, 10);
        break;
      }
    }

    if (breachCount === 0) {
      return {
        provider: 'Have I Been Pwned',
        success: true,
        verdict: 'clean',
        score: 0,
        details: 'Password has NOT been found in any known data breaches',
        indicators: { breachCount: 0, safe: true },
      };
    }

    return {
      provider: 'Have I Been Pwned',
      success: true,
      verdict: breachCount > 100 ? 'malicious' : 'suspicious',
      score: Math.min(breachCount / 100, 100),
      details: `Password found in ${breachCount.toLocaleString()} data breach(es) - change immediately!`,
      indicators: { 
        breachCount,
        recommendation: 'This password is compromised. Do not use it anywhere.'
      },
    };
  } catch (error) {
    return { 
      provider: 'Have I Been Pwned', 
      success: false, 
      details: 'Failed to check password breaches',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function executeSecurityAction(
  config: ActionConfig,
  apiKeys: Record<string, string>
): Promise<IntegrationResult> {
  const { actionType, target, provider } = config;

  switch (actionType) {
    case 'scan_url':
      if (apiKeys.VIRUSTOTAL_API_KEY) {
        return virusTotalIntegration.scanUrl(target, apiKeys.VIRUSTOTAL_API_KEY);
      }
      return { provider: 'VirusTotal', success: false, details: 'VirusTotal API key not configured', error: 'missing_key' };

    case 'scan_file':
      if (apiKeys.VIRUSTOTAL_API_KEY) {
        return virusTotalIntegration.scanFileHash(target, apiKeys.VIRUSTOTAL_API_KEY);
      }
      return { provider: 'VirusTotal', success: false, details: 'VirusTotal API key not configured', error: 'missing_key' };

    case 'check_ip':
      if (provider === 'alienvault' && apiKeys.ALIENVAULT_OTX_API_KEY) {
        return alienVaultOTXIntegration.checkIP(target, apiKeys.ALIENVAULT_OTX_API_KEY);
      }
      if (apiKeys.ABUSEIPDB_API_KEY) {
        return abuseIPDBIntegration.checkIP(target, apiKeys.ABUSEIPDB_API_KEY);
      }
      return { provider: 'AbuseIPDB', success: false, details: 'AbuseIPDB API key not configured', error: 'missing_key' };

    case 'check_domain':
      if (apiKeys.ALIENVAULT_OTX_API_KEY) {
        return alienVaultOTXIntegration.checkDomain(target, apiKeys.ALIENVAULT_OTX_API_KEY);
      }
      return { provider: 'AlienVault OTX', success: false, details: 'AlienVault OTX API key not configured', error: 'missing_key' };

    case 'check_email_breach':
      if (apiKeys.HIBP_API_KEY) {
        return hibpIntegration.checkEmail(target, apiKeys.HIBP_API_KEY);
      }
      return { provider: 'Have I Been Pwned', success: false, details: 'HIBP API key not configured', error: 'missing_key' };

    case 'check_password_breach':
      return checkPasswordBreach(target);

    case 'threat_intel_lookup':
      const results: IntegrationResult[] = [];
      
      if (apiKeys.ALIENVAULT_OTX_API_KEY) {
        const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target);
        if (isIP) {
          results.push(await alienVaultOTXIntegration.checkIP(target, apiKeys.ALIENVAULT_OTX_API_KEY));
        } else {
          results.push(await alienVaultOTXIntegration.checkDomain(target, apiKeys.ALIENVAULT_OTX_API_KEY));
        }
      }
      
      if (results.length > 0) {
        return results[0];
      }
      return { provider: 'Threat Intel', success: false, details: 'No threat intelligence API keys configured', error: 'missing_key' };

    case 'check_malware_url':
      return urlhausIntegration.checkUrl(target);

    case 'check_malware_hash':
      return malwareBazaarIntegration.checkHash(target);

    case 'check_phishing':
      return phishtankIntegration.checkUrl(target);

    case 'check_exposed_services':
      if (apiKeys.SHODAN_API_KEY) {
        return shodanIntegration.checkIP(target, apiKeys.SHODAN_API_KEY);
      }
      return { provider: 'Shodan', success: false, details: 'Shodan API key not configured', error: 'missing_key' };

    case 'check_scanner_ip':
      return greynoiseIntegration.checkIP(target, apiKeys.GREYNOISE_API_KEY);

    default:
      return { provider: 'Unknown', success: false, details: `Unknown action type: ${actionType}`, error: 'invalid_action' };
  }
}

export function getIntegrationStatus(apiKeys: Record<string, string | undefined>): Record<string, boolean> {
  return {
    virustotal: !!apiKeys.VIRUSTOTAL_API_KEY,
    abuseipdb: !!apiKeys.ABUSEIPDB_API_KEY,
    alienvault: !!apiKeys.ALIENVAULT_OTX_API_KEY,
    hibp: !!apiKeys.HIBP_API_KEY,
    urlhaus: true,
    malwarebazaar: true,
    phishtank: true,
    shodan: !!apiKeys.SHODAN_API_KEY,
    greynoise: true,
  };
}
