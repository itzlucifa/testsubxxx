import { useState, useEffect, useRef } from 'react';

interface NetworkPrivacyGuardOptions {
  blockVoiceTracking?: boolean;
  blockAnalytics?: boolean;
  blockSocialMedia?: boolean;
  customBlockedDomains?: string[];
}

interface PrivacyViolation {
  type: 'voice-tracking' | 'analytics' | 'social-media' | 'custom';
  domain: string;
  timestamp: number;
  blocked: boolean;
  reason: string;
}

interface NetworkPrivacyState {
  isActive: boolean;
  violationsBlocked: number;
  currentViolations: PrivacyViolation[];
  protectionLevel: 'high' | 'medium' | 'low';
}

// Comprehensive list of domains known for voice/data collection
const TRACKING_DOMAINS = {
  voiceTracking: [
    'speech.googleapis.com',
    'api.speech-to-text.com',
    'watson.platform.com',
    'azure.microsoft.com',
    'aws.amazon.com',
    'wit.ai',
    'dialogflow.googleapis.com',
    'lex.amazon.com',
    'transcribe.streaming.us-east-1.amazonaws.com',
    'speech.platform.bing.com',
    'dictation.nuance.com'
  ],
  
  analytics: [
    'google-analytics.com',
    'analytics.google.com',
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'facebook.com',
    'facebook.net',
    'fbcdn.net',
    'connect.facebook.net',
    'linkedin.com',
    'ads.linkedin.com',
    'twitter.com',
    'ads.twitter.com',
    'pinterest.com',
    'ads.pinterest.com',
    'snapchat.com',
    'ads.snapchat.com'
  ],
  
  socialMedia: [
    'instagram.com',
    'tiktok.com',
    'youtube.com',
    'twitch.tv',
    'reddit.com',
    'whatsapp.com',
    'telegram.org',
    'discord.com',
    'slack.com',
    'zoom.us',
    'skype.com',
    'teams.microsoft.com'
  ]
};

export function useNetworkPrivacyGuard(options: NetworkPrivacyGuardOptions = {}) {
  const {
    blockVoiceTracking = true,
    blockAnalytics = true,
    blockSocialMedia = true,
    customBlockedDomains = []
  } = options;

  const [state, setState] = useState<NetworkPrivacyState>({
    isActive: false,
    violationsBlocked: 0,
    currentViolations: [],
    protectionLevel: 'high'
  });

  const violationLogRef = useRef<PrivacyViolation[]>([]);
  const isActiveRef = useRef(false);

  // Build comprehensive blocked domains list
  const getAllBlockedDomains = (): Set<string> => {
    const blocked = new Set<string>();
    
    if (blockVoiceTracking) {
      TRACKING_DOMAINS.voiceTracking.forEach(domain => blocked.add(domain));
    }
    
    if (blockAnalytics) {
      TRACKING_DOMAINS.analytics.forEach(domain => blocked.add(domain));
    }
    
    if (blockSocialMedia) {
      TRACKING_DOMAINS.socialMedia.forEach(domain => blocked.add(domain));
    }
    
    customBlockedDomains.forEach(domain => blocked.add(domain));
    
    return blocked;
  };

  // Categorize violation type
  const categorizeViolation = (domain: string): PrivacyViolation['type'] => {
    if (TRACKING_DOMAINS.voiceTracking.includes(domain)) return 'voice-tracking';
    if (TRACKING_DOMAINS.analytics.includes(domain)) return 'analytics';
    if (TRACKING_DOMAINS.socialMedia.includes(domain)) return 'social-media';
    return 'custom';
  };

  // Get violation reason
  const getViolationReason = (type: PrivacyViolation['type']): string => {
    const reasons = {
      'voice-tracking': 'Voice data collection prevention',
      'analytics': 'User behavior tracking prevention',
      'social-media': 'Social platform data collection prevention',
      'custom': 'Custom domain blocking'
    };
    return reasons[type];
  };

  // Network request interceptor
  useEffect(() => {
    if (!isActiveRef.current) return;

    const blockedDomains = getAllBlockedDomains();
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      const hostname = new URL(url, window.location.origin).hostname;
      
      if (blockedDomains.has(hostname)) {
        const violation: PrivacyViolation = {
          type: categorizeViolation(hostname),
          domain: hostname,
          timestamp: Date.now(),
          blocked: true,
          reason: getViolationReason(categorizeViolation(hostname))
        };
        
        violationLogRef.current.push(violation);
        setState(prev => ({
          ...prev,
          violationsBlocked: prev.violationsBlocked + 1,
          currentViolations: [...violationLogRef.current].slice(-50) // Keep last 50 violations
        }));
        
        // Block the request by returning a rejected promise
        console.warn(`🛡️ Privacy Guard: Blocked request to ${hostname} - ${violation.reason}`);
        return Promise.reject(new Error(`Privacy violation blocked: ${hostname}`));
      }
      
      return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      const hostname = new URL(url?.toString() || '', window.location.origin).hostname;
      
      if (blockedDomains.has(hostname)) {
        const violation: PrivacyViolation = {
          type: categorizeViolation(hostname),
          domain: hostname,
          timestamp: Date.now(),
          blocked: true,
          reason: getViolationReason(categorizeViolation(hostname))
        };
        
        violationLogRef.current.push(violation);
        setState(prev => ({
          ...prev,
          violationsBlocked: prev.violationsBlocked + 1,
          currentViolations: [...violationLogRef.current].slice(-50)
        }));
        
        console.warn(`🛡️ Privacy Guard: Blocked XHR request to ${hostname} - ${violation.reason}`);
        // Prevent the request from completing
        setTimeout(() => {
          try {
            this.dispatchEvent(new Event('error'));
          } catch (e) {
            // Silent fail for blocked requests
          }
        }, 0);
      }
      
      return originalXHROpen.apply(this, arguments as any);
    };

    // Monitor WebSocket connections
    const originalWebSocket = window.WebSocket;
    (window as any).WebSocket = function(url: string, protocols?: any) {
      const hostname = new URL(url, window.location.origin).hostname;
      
      if (blockedDomains.has(hostname)) {
        const violation: PrivacyViolation = {
          type: categorizeViolation(hostname),
          domain: hostname,
          timestamp: Date.now(),
          blocked: true,
          reason: getViolationReason(categorizeViolation(hostname))
        };
        
        violationLogRef.current.push(violation);
        setState(prev => ({
          ...prev,
          violationsBlocked: prev.violationsBlocked + 1,
          currentViolations: [...violationLogRef.current].slice(-50)
        }));
        
        console.warn(`🛡️ Privacy Guard: Blocked WebSocket connection to ${hostname} - ${violation.reason}`);
        throw new Error(`Privacy violation blocked: ${hostname}`);
      }
      
      return new originalWebSocket(url, protocols);
    };

    return () => {
      // Restore original functions
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      (window as any).WebSocket = originalWebSocket;
    };
  }, [blockVoiceTracking, blockAnalytics, blockSocialMedia, customBlockedDomains]);

  // Calculate protection level
  useEffect(() => {
    const calculateProtectionLevel = (): 'high' | 'medium' | 'low' => {
      const totalFeatures = 3; // voiceTracking, analytics, socialMedia
      const enabledFeatures = [
        blockVoiceTracking,
        blockAnalytics,
        blockSocialMedia
      ].filter(Boolean).length;
      
      if (enabledFeatures === totalFeatures) return 'high';
      if (enabledFeatures >= 2) return 'medium';
      return 'low';
    };

    setState(prev => ({
      ...prev,
      protectionLevel: calculateProtectionLevel()
    }));
  }, [blockVoiceTracking, blockAnalytics, blockSocialMedia]);

  const activateGuard = () => {
    isActiveRef.current = true;
    setState(prev => ({ ...prev, isActive: true }));
    console.log('🛡️ Network Privacy Guard activated');
  };

  const deactivateGuard = () => {
    isActiveRef.current = false;
    setState(prev => ({ ...prev, isActive: false }));
    console.log('🛡️ Network Privacy Guard deactivated');
  };

  const toggleGuard = () => {
    if (isActiveRef.current) {
      deactivateGuard();
    } else {
      activateGuard();
    }
  };

  const getReport = () => {
    return {
      totalViolationsBlocked: state.violationsBlocked,
      recentViolations: state.currentViolations.slice(-10),
      protectionLevel: state.protectionLevel,
      isActive: state.isActive,
      blockedCategories: {
        voiceTracking: blockVoiceTracking,
        analytics: blockAnalytics,
        socialMedia: blockSocialMedia
      }
    };
  };

  const clearViolations = () => {
    violationLogRef.current = [];
    setState(prev => ({ ...prev, violationsBlocked: 0, currentViolations: [] }));
  };

  return {
    ...state,
    activateGuard,
    deactivateGuard,
    toggleGuard,
    getReport,
    clearViolations
  };
}

export type { NetworkPrivacyState, PrivacyViolation };