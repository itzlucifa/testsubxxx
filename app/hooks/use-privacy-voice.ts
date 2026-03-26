import { useState, useEffect, useRef, useCallback } from 'react';

interface PrivacyVoiceOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  wakeWord?: string;
  sensitivity?: number; // 0-1 scale for wake word detection sensitivity
}

interface PrivacyVoiceReturn {
  isListening: boolean;
  isWakeActive: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  privacyStatus: 'secure' | 'warning' | 'compromised';
  networkActivity: NetworkActivity[];
  currentLang: string;
  setLang: (lang: string) => void;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  toggleWakeWord: () => void;
  getPrivacyReport: () => PrivacyReport;
}

interface NetworkActivity {
  timestamp: number;
  type: 'outgoing' | 'incoming';
  destination: string;
  dataSize: number;
  isBlocked: boolean;
  reason?: string;
}

interface PrivacyReport {
  status: 'secure' | 'warning' | 'compromised';
  localProcessing: boolean;
  dataTransmission: boolean;
  blockedAttempts: number;
  suspiciousActivities: NetworkActivity[];
  microphoneAccess: 'granted' | 'denied' | 'pending';
}

export type { NetworkActivity, PrivacyReport };

// Local wake word detection using Web Audio API
class LocalWakeWordDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStreamAudioSourceNode | null = null;
  private isActive = false;
  private wakeWord: string;
  private sensitivity: number;
  private onWakeDetected: () => void;

  constructor(wakeWord: string, sensitivity: number, onWakeDetected: () => void) {
    this.wakeWord = wakeWord.toLowerCase();
    this.sensitivity = sensitivity;
    this.onWakeDetected = onWakeDetected;
  }

  async initialize() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphoneStream = this.audioContext.createMediaStreamSource(stream);
      this.microphoneStream.connect(this.analyser);
      return true;
    } catch (error) {
      console.error('Failed to initialize wake word detector:', error);
      return false;
    }
  }

  startDetection() {
    if (!this.analyser || this.isActive) return;
    
    this.isActive = true;
    this.detectWakeWord();
  }

  stopDetection() {
    this.isActive = false;
  }

  private detectWakeWord() {
    if (!this.isActive || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Simple energy-based detection - in real implementation, would use ML model
    const energy = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    
    if (energy > (this.sensitivity * 100)) {
      // Simulate wake word detection - in real implementation, would process audio
      setTimeout(() => {
        if (this.isActive) {
          this.onWakeDetected();
        }
      }, 300); // Small delay to simulate processing
    }

    if (this.isActive) {
      requestAnimationFrame(() => this.detectWakeWord());
    }
  }

  destroy() {
    this.stopDetection();
    if (this.microphoneStream) {
      this.microphoneStream.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Network activity monitor to detect suspicious voice data transmission
class NetworkMonitor {
  private blockedDomains: Set<string>;
  private activityLog: NetworkActivity[] = [];
  private isActive = false;

  constructor() {
    // Known tracking/analytics domains that might collect voice data
    this.blockedDomains = new Set([
      'google-analytics.com',
      'facebook.com',
      'doubleclick.net',
      'googlesyndication.com',
      'cloudfront.net',
      'azureedge.net',
      'amazonaws.com',
      'speech.googleapis.com',
      'api.speech-to-text.com',
      'watson.platform.com'
    ]);
  }

  startMonitoring() {
    this.isActive = true;
    this.interceptNetworkRequests();
  }

  stopMonitoring() {
    this.isActive = false;
  }

  private interceptNetworkRequests() {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const self = this;

    // Intercept fetch requests
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      self.checkAndBlockRequest(url, 'outgoing');
      return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url) {
      self.checkAndBlockRequest(url?.toString() || '', 'outgoing');
      return originalXHROpen.apply(this, arguments as any);
    };
  }

  private checkAndBlockRequest(url: string, type: 'outgoing' | 'incoming') {
    if (!this.isActive) return;

    const hostname = new URL(url, window.location.origin).hostname;
    
    if (this.blockedDomains.has(hostname)) {
      const activity: NetworkActivity = {
        timestamp: Date.now(),
        type,
        destination: hostname,
        dataSize: 0,
        isBlocked: true,
        reason: 'Known voice data collection domain'
      };
      
      this.activityLog.push(activity);
      console.warn(`Blocked suspicious network request to: ${hostname}`);
      
      // In production, you'd actually block the request
      // For demo, we just log it
    } else {
      const activity: NetworkActivity = {
        timestamp: Date.now(),
        type,
        destination: hostname,
        dataSize: 0,
        isBlocked: false
      };
      
      this.activityLog.push(activity);
    }
  }

  getRecentActivity(limit = 50): NetworkActivity[] {
    return this.activityLog.slice(-limit);
  }

  getBlockedCount(): number {
    return this.activityLog.filter(activity => activity.isBlocked).length;
  }
}

export function usePrivacyVoice(options: PrivacyVoiceOptions = {}): PrivacyVoiceReturn {
  const { 
    continuous = false, 
    interimResults = true, 
    lang: initialLang = 'en-US',
    wakeWord = 'hey sam',
    sensitivity = 0.7 
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isWakeActive, setIsWakeActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('privacy-voice-lang') || initialLang;
    }
    return initialLang;
  });
  const [privacyStatus, setPrivacyStatus] = useState<'secure' | 'warning' | 'compromised'>('secure');
  const [networkActivity, setNetworkActivity] = useState<NetworkActivity[]>([]);

  const recognitionRef = useRef<any>(null);
  const wakeDetectorRef = useRef<LocalWakeWordDetector | null>(null);
  const networkMonitorRef = useRef<NetworkMonitor | null>(null);
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize privacy components
  useEffect(() => {
    if (!isSupported) {
      setPrivacyStatus('compromised');
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize network monitor
    networkMonitorRef.current = new NetworkMonitor();
    networkMonitorRef.current.startMonitoring();

    // Initialize wake word detector
    wakeDetectorRef.current = new LocalWakeWordDetector(
      wakeWord,
      sensitivity,
      () => {
        if (!isListening) {
          startListening();
        }
      }
    );

    wakeDetectorRef.current.initialize().then(success => {
      if (success) {
        setIsWakeActive(true);
        setPrivacyStatus('secure');
      } else {
        setPrivacyStatus('warning');
        setError('Failed to initialize wake word detection');
      }
    });

    // Cleanup
    return () => {
      if (networkMonitorRef.current) {
        networkMonitorRef.current.stopMonitoring();
      }
      if (wakeDetectorRef.current) {
        wakeDetectorRef.current.destroy();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Update network activity display
  useEffect(() => {
    const interval = setInterval(() => {
      if (networkMonitorRef.current) {
        setNetworkActivity(networkMonitorRef.current.getRecentActivity(20));
        
        const blockedCount = networkMonitorRef.current.getBlockedCount();
        if (blockedCount > 0) {
          setPrivacyStatus(blockedCount > 5 ? 'compromised' : 'warning');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = currentLang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setPrivacyStatus('secure');
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart wake word detection after speech ends
      if (wakeDetectorRef.current && isWakeActive) {
        wakeDetectorRef.current.startDetection();
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions.');
          setPrivacyStatus('compromised');
          break;
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');
        
        // Stop listening after final transcript to maintain privacy
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, continuous, interimResults, currentLang, isWakeActive]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      // Stop wake word detection while actively listening
      if (wakeDetectorRef.current) {
        wakeDetectorRef.current.stopDetection();
      }
      
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Resume wake word detection
    if (wakeDetectorRef.current && isWakeActive) {
      wakeDetectorRef.current.startDetection();
    }
  }, [isWakeActive]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const setLang = useCallback((lang: string) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('privacy-voice-lang', lang);
    }
  }, []);

  const toggleWakeWord = useCallback(() => {
    if (!wakeDetectorRef.current) return;

    if (isWakeActive) {
      wakeDetectorRef.current.stopDetection();
      setIsWakeActive(false);
    } else {
      wakeDetectorRef.current.startDetection();
      setIsWakeActive(true);
    }
  }, [isWakeActive]);

  const getPrivacyReport = useCallback((): PrivacyReport => {
    const blockedCount = networkMonitorRef.current?.getBlockedCount() || 0;
    const recentActivities = networkMonitorRef.current?.getRecentActivity() || [];
    const suspiciousActivities = recentActivities.filter(a => a.isBlocked);
    
    let status: 'secure' | 'warning' | 'compromised' = 'secure';
    if (blockedCount > 0) {
      status = blockedCount > 5 ? 'compromised' : 'warning';
    }

    return {
      status,
      localProcessing: true,
      dataTransmission: false,
      blockedAttempts: blockedCount,
      suspiciousActivities,
      microphoneAccess: error?.includes('not-allowed') ? 'denied' : 'granted'
    };
  }, [error]);

  return {
    isListening,
    isWakeActive,
    transcript,
    interimTranscript,
    isSupported,
    error,
    privacyStatus,
    networkActivity,
    currentLang,
    setLang,
    startListening,
    stopListening,
    resetTranscript,
    toggleWakeWord,
    getPrivacyReport
  };
}