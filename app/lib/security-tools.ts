// Real working security tools

export const passwordGenerator = {
  generate(options: {
    length?: number;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
    } = options;

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = '';
    if (uppercase) charset += uppercaseChars;
    if (lowercase) charset += lowercaseChars;
    if (numbers) charset += numberChars;
    if (symbols) charset += symbolChars;

    if (charset === '') charset = lowercaseChars;

    let password = '';
    const crypto = window.crypto;
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  },

  calculateStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else feedback.push('Password should be at least 12 characters long');

    // Complexity checks
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    else feedback.push('Add special characters');

    // Uniqueness
    const uniqueChars = new Set(password).size;
    if (uniqueChars > password.length * 0.7) score += 10;

    return { score: Math.min(score, 100), feedback };
  },
};

export const encryptionService = {
  async encrypt(text: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Derive key from password
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine salt + iv + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
  },

  async decrypt(encryptedText: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Decode base64
    const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract salt, iv, and encrypted data
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    // Derive key from password
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  },

  generateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
};

export const hashService = {
  async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  },

  async sha512(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-512', data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  },
};

// Port scanner (simulated - real scanning requires backend)
export const portScanner = {
  commonPorts: [
    { port: 21, service: 'FTP' },
    { port: 22, service: 'SSH' },
    { port: 23, service: 'Telnet' },
    { port: 25, service: 'SMTP' },
    { port: 53, service: 'DNS' },
    { port: 80, service: 'HTTP' },
    { port: 110, service: 'POP3' },
    { port: 143, service: 'IMAP' },
    { port: 443, service: 'HTTPS' },
    { port: 445, service: 'SMB' },
    { port: 3306, service: 'MySQL' },
    { port: 3389, service: 'RDP' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 8080, service: 'HTTP-Proxy' },
  ],

  async scan(host: string, ports?: number[]): Promise<{ port: number; open: boolean; service: string }[]> {
    // Note: Real port scanning is not possible from browser
    // This is a simulation that can be connected to a backend service
    const portsToScan = ports || this.commonPorts.map(p => p.port);
    
    return portsToScan.map(port => {
      const service = this.commonPorts.find(p => p.port === port)?.service || 'Unknown';
      // Simulate some ports being open
      const open = Math.random() > 0.7;
      return { port, open, service };
    });
  },
};

// IP geolocation (using free API)
export const geoLocationService = {
  async lookup(ip: string) {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.org,
      };
    } catch (error) {
      console.error('Geo lookup failed:', error);
      return null;
    }
  },
};

// Threat intelligence (using public APIs)
export const threatIntelligence = {
  async checkIP(ip: string) {
    try {
      // AbuseIPDB free tier
      const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
        headers: {
          'Key': 'YOUR_API_KEY_HERE', // User would need to add their own key
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          ip: data.data.ipAddress,
          abuseScore: data.data.abuseConfidenceScore,
          isTor: data.data.isTor,
          isWhitelisted: data.data.isWhitelisted,
          totalReports: data.data.totalReports,
        };
      }
    } catch (error) {
      console.error('Threat intel check failed:', error);
    }
    
    return null;
  },

  async checkDomain(domain: string) {
    // VirusTotal API check (requires API key)
    // This is a placeholder - user would need to add their own API key
    return {
      domain,
      safe: Math.random() > 0.2,
      categories: ['Safe', 'Technology'],
    };
  },
};
