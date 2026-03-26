import type { Route } from './+types/ai-assistant';
import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '~/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
import { Button } from '../components/ui/button/button';
import { Badge } from '../components/ui/badge/badge';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, AlertTriangle, Shield, TrendingUp, Globe } from 'lucide-react';
import { SamLogo } from '../components/ui/sam-logo/sam-logo';
import { Textarea } from '../components/ui/textarea/textarea';
import { useAuth } from '../hooks/use-auth';
import { useRealTimeThreats } from '../hooks/use-real-time-threats';
import { useRealTimeAlerts } from '../hooks/use-real-time-alerts';
import { useRealTimeDevices } from '../hooks/use-real-time-devices';
import { usePrivacyVoice } from '../hooks/use-privacy-voice';
import { useNetworkPrivacyGuard } from '../hooks/use-network-privacy-guard';
import { useSpeechSynthesis } from '../hooks/use-speech-synthesis';
import { PrivacyDashboard } from '../components/ui/privacy-dashboard/privacy-dashboard';
import { NetworkPrivacyPanel } from '../components/ui/network-privacy-panel/network-privacy-panel';
import { useVoiceCommands } from '../hooks/use-voice-commands';
import { getTranslation } from '../utils/sam-translations';
import styles from './ai-assistant.module.css';

// Add CSS module styles for the new layout
const additionalStyles = `
  .mainContent {
    flex: 1;
    min-width: 0;
  }
  
  .sidebar {
    width: 350px;
    flex-shrink: 0;
    margin-left: 1rem;
  }
  
  @media (max-width: 1024px) {
    .sidebar {
      width: 100%;
      margin-left: 0;
      margin-top: 1rem;
    }
    
    .content {
      flex-direction: column;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'SAM AI Assistant - CYBERSHIELD' },
    { name: 'description', content: 'Azure OpenAI GPT-4o powered security intelligence' },
  ];
}

interface Message {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { threats } = useRealTimeThreats(user?.id);
  const { alerts } = useRealTimeAlerts(user?.id);
  const { devices } = useRealTimeDevices(user?.id);
  
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { 
      role: 'assistant', 
      message: `Hello, I'm SAM - your Security & Monitoring AI assistant.

I can help you navigate and control CYBERSHIELD using voice or text commands:

• "Go to Dashboard" - Navigate to any section
• "Scan my devices" - Start security scans
• "Show threats" - View active threats
• "Generate password" - Access security tools

Just speak or type your command. How can I assist you today?`,
      timestamp: new Date()
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUPPORTED_LANGUAGES = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Portuguese (BR)', flag: '🇧🇷' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
    { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
    { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  ];

  const {
    isListening,
    isWakeActive,
    transcript,
    interimTranscript,
    isSupported: speechRecognitionSupported,
    error: speechError,
    privacyStatus,
    networkActivity,
    currentLang: recognitionLang,
    setLang: setRecognitionLang,
    startListening,
    stopListening,
    resetTranscript,
    toggleWakeWord,
    getPrivacyReport,
  } = usePrivacyVoice({ 
    continuous: false, 
    interimResults: true,
    wakeWord: 'hey sam',
    sensitivity: 0.7
  });

  const {
    isActive: isNetworkGuardActive,
    violationsBlocked,
    currentViolations,
    protectionLevel,
    activateGuard,
    deactivateGuard,
    toggleGuard,
    getReport,
    clearViolations
  } = useNetworkPrivacyGuard({
    blockVoiceTracking: true,
    blockAnalytics: true,
    blockSocialMedia: true
  });

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isMuted,
    setMuted,
    isSupported: speechSynthesisSupported,
    currentLang: synthesisLang,
    setLang: setSynthesisLang,
  } = useSpeechSynthesis({ rate: 1, pitch: 1 });

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const { executeCommand, isCommand } = useVoiceCommands();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const handleLanguageChange = (langCode: string) => {
    setRecognitionLang(langCode);
    setSynthesisLang(langCode);
    setShowLanguageMenu(false);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === recognitionLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (interimTranscript && !transcript) {
      setInputMessage(interimTranscript);
    }
  }, [interimTranscript, transcript]);

  // Auto-send message when speech recognition stops and there's input
  useEffect(() => {
    if (!isListening && inputMessage.trim() && (transcript || interimTranscript)) {
      // Add a small delay to ensure transcript is fully updated
      const timer = setTimeout(() => {
        if (inputMessage.trim()) {
          handleSend();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isListening, inputMessage, transcript, interimTranscript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      // Stop listening but don't send yet - the effect will handle sending
      stopListening();
    } else {
      // Clear previous transcript and input when starting to listen
      resetTranscript();
      setInputMessage('');
      startListening();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const generateAIResponse = (userQuestion: string): string => {
    const lowerQuestion = userQuestion.toLowerCase();
    const lang = recognitionLang;
    const params = {
      deviceCount: devices.length,
      threatCount: threats.length,
      blockedCount: threats.filter(t => t.blocked).length,
      alertCount: alerts.filter(a => !a.read).length,
      criticalCount: threats.filter(t => t.severity === 'critical').length,
    };
    
    // Greetings & casual conversation
    if (lowerQuestion.match(/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo|howdy|greetings|hola|bonjour|hallo|ciao|cześć|merhaba|xin chào|你好|こんにちは|안녕|مرحبا|नमस्ते)/)) {
      return getTranslation(lang, 'greeting', params);
    }

    // How are you / How's it going
    if (lowerQuestion.match(/(how are you|how's it going|how are things|what's up|you good|you okay|cómo estás|comment ça va|wie geht's|come stai|jak się masz)/)) {
      return getTranslation(lang, 'howAreYou', params);
    }

    // What's your name / Who are you
    if (lowerQuestion.match(/(what's your name|who are you|tell me about yourself|introduce yourself|quién eres|qui es-tu|wer bist du)/)) {
      return getTranslation(lang, 'introduction', params);
    }

    // Thanks/appreciation
    if (lowerQuestion.match(/(thank|thanks|appreciate|grateful|you're awesome|love you|gracias|merci|danke|grazie|obrigado|спасибо|شكرا|धन्यवाद)/)) {
      return getTranslation(lang, 'thanks', params);
    }

    // Casual chitchat - Weather, life, etc.
    if (lowerQuestion.match(/(how's the weather|what's the weather|nice day|beautiful day|cold today|hot today)/)) {
      return `As an AI, I don't experience weather, but I can tell you about your network climate. Currently tracking ${threats.length} threats and monitoring ${devices.length} devices. Is there anything security-related I can help you with?`;
    }

    // What can you do - explanation
    if (lowerQuestion.match(/(what can you do|what do you do|your capabilities|help me with|qué puedes hacer|que peux-tu faire|was kannst du)/)) {
      return getTranslation(lang, 'capabilities', params) + '\n\n' + getTranslation(lang, 'helpMessage', params);
    }

    // Bored / Entertain me
    if (lowerQuestion.match(/(i'm bored|i am bored|entertain me|something interesting)/)) {
      return `Here are some cybersecurity facts you might find interesting:

**Industry Statistics:**
- A cyberattack occurs every 39 seconds globally
- 91% of cyberattacks begin with a phishing email
- The average data breach takes 287 days to identify
- Cybercrime costs over $6 trillion annually worldwide

**Your Current Status:**
- ${devices.length} devices under protection
- ${threats.length} threats tracked
- ${alerts.filter(a => !a.read).length} unread alerts

Would you like me to explain any of these statistics or discuss security best practices?`;
    }

    // Privacy questions
    if (lowerQuestion.includes('privacy') || lowerQuestion.includes('data protection') || lowerQuestion.includes('personal data')) {
      return `**Privacy & Data Protection Analysis:**

**Current Status:**
- Your devices are ${devices.filter(d => d.status === 'safe').length > devices.length / 2 ? 'well-protected' : 'at risk'} from data breaches
- ${threats.filter(t => t.type.toLowerCase().includes('phishing')).length} phishing attempts blocked
- ${devices.filter(d => d.vulnerabilityCount > 0).length} devices have security gaps

**Recommended Best Practices:**
1. Enable two-factor authentication on all critical accounts
2. Use a VPN when on public WiFi networks
3. Avoid clicking links in suspicious emails
4. Keep all software and devices updated
5. Delete unnecessary personal data and old accounts

Would you like more details on any specific privacy topic?`;
    }

    // Explain threats in simple terms
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('explain') || lowerQuestion.includes('tell me about')) {
      if (lowerQuestion.includes('malware')) {
        return `🦠 **Understanding Malware (Malicious Software):**\n\n` +
          `Think of malware as digital viruses that infect your computer, just like biological viruses infect people.\n\n` +
          `**Types of Malware:**\n` +
          `• **Viruses**: Attach to files and spread when you open them\n` +
          `• **Ransomware**: Locks your files and demands payment to unlock them\n` +
          `• **Trojans**: Disguise themselves as legitimate software\n` +
          `• **Spyware**: Secretly monitors your activity and steals data\n\n` +
          `**How You Get Infected:**\n` +
          `• Opening suspicious email attachments\n` +
          `• Downloading from untrusted websites\n` +
          `• Clicking on fake ads or pop-ups\n\n` +
          `**Protection:** I'm actively monitoring for ${threats.filter(t => t.type.toLowerCase().includes('malware')).length} malware threats right now and blocking them before they harm you!`;
      }
      
      if (lowerQuestion.includes('phishing')) {
        return `🎣 **Phishing Explained Simply:**\n\n` +
          `Phishing is like a con artist pretending to be someone you trust to steal your information.\n\n` +
          `**Common Phishing Tactics:**\n` +
          `• Fake emails from "your bank" asking for passwords\n` +
          `• Text messages claiming you won a prize\n` +
          `• Websites that look like Facebook/Amazon but are fake\n\n` +
          `**Red Flags to Watch For:**\n` +
          `🚩 Urgent language ("Act now or account will close!")\n` +
          `🚩 Spelling/grammar mistakes\n` +
          `🚩 Suspicious email addresses\n` +
          `🚩 Requests for passwords or credit card info\n\n` +
          `**I've blocked ${threats.filter(t => t.type.toLowerCase().includes('phishing')).length} phishing attempts** protecting you so far! Always verify before clicking.`;
      }

      if (lowerQuestion.includes('firewall')) {
        return `🔥 **Firewall - Your Digital Bodyguard:**\n\n` +
          `Imagine a bouncer at a club checking IDs - that's what a firewall does for your network!\n\n` +
          `**How It Works:**\n` +
          `• Monitors all incoming/outgoing network traffic\n` +
          `• Blocks suspicious connections\n` +
          `• Only allows trusted traffic through\n\n` +
          `**Your Firewall Status:**\n` +
          `✅ Active and protecting ${devices.length} devices\n` +
          `🛡️ Blocked ${threats.filter(t => t.blocked).length} unauthorized access attempts\n\n` +
          `Think of it as your first line of defense!`;
      }
    }

    // Security status
    if (lowerQuestion.includes('status') || lowerQuestion.includes('how am i doing') || lowerQuestion.includes('security') || lowerQuestion.includes('seguridad') || lowerQuestion.includes('sécurité') || lowerQuestion.includes('sicherheit')) {
      const criticalThreats = threats.filter(t => t.severity === 'critical').length;
      const securityScore = Math.max(0, 100 - (criticalThreats * 15) - (threats.filter(t => t.severity === 'high').length * 5));
      
      if (securityScore >= 80) {
        return getTranslation(lang, 'statusGood', params);
      } else if (criticalThreats > 0) {
        return getTranslation(lang, 'statusCritical', { ...params, criticalCount: criticalThreats });
      } else {
        return getTranslation(lang, 'statusWarning', params);
      }
    }
    
    // Threats
    if (lowerQuestion.includes('threat') || lowerQuestion.includes('attack') || lowerQuestion.includes('danger')) {
      const recentThreats = threats.slice(0, 3);
      if (recentThreats.length === 0) {
        return `✅ **Great news!** No active threats detected at this time.\n\n` +
          `Your defenses are working perfectly. I'm continuously monitoring and will alert you immediately if anything suspicious appears.\n\n` +
          `Stay vigilant and keep your security practices strong! 🛡️`;
      }
      
      let response = `🚨 **Active Threat Analysis:**\n\n`;
      response += `I'm currently tracking **${threats.length} threats** in real-time. Here's what you need to know:\n\n`;
      response += `**Most Recent Threats:**\n`;
      recentThreats.forEach((threat, idx) => {
        const severityEmoji = threat.severity === 'critical' ? '🔴' : threat.severity === 'high' ? '🟠' : '🟡';
        response += `${idx + 1}. ${severityEmoji} **${threat.type}** - ${threat.severity.toUpperCase()}\n`;
        response += `   📍 Source: ${threat.source}\n`;
        response += `   ${threat.blocked ? '✅ Blocked successfully' : '⚠️ Needs action'}\n\n`;
      });
      
      const criticalCount = threats.filter(t => t.severity === 'critical').length;
      if (criticalCount > 0) {
        response += `⚠️ **Critical Alert:** ${criticalCount} threats are marked critical. These require immediate action!\n\n`;
      }
      
      response += `💡 **My Recommendation:** Review the Threats page for detailed analysis and remediation steps. I'll guide you through fixing each one.`;
      return response;
    }
    
    // Alerts
    if (lowerQuestion.includes('alert') || lowerQuestion.includes('notification')) {
      const unreadAlerts = alerts.filter(a => !a.read);
      if (unreadAlerts.length === 0) {
        return `✅ **All caught up!** No unread alerts at this time.\n\n` +
          `All systems are running smoothly. I'll notify you immediately if anything requires your attention.\n\n` +
          `You're doing an excellent job staying on top of security! 🌟`;
      }
      
      return `🔔 **Alert Summary:**\n\n` +
        `You have **${unreadAlerts.length} unread alerts** that need your attention. Let me break them down for you:\n\n` +
        `**Latest Alerts:**\n` +
        unreadAlerts.slice(0, 3).map((alert, idx) => 
          `${idx + 1}. **${alert.title}** (${alert.severity.toUpperCase()})\n   ${alert.message}\n   ⏰ Time: ${new Date(alert.timestamp).toLocaleTimeString()}`
        ).join('\n\n') +
        `\n\n` +
        (unreadAlerts.length > 3 ? `...and ${unreadAlerts.length - 3} more\n\n` : '') +
        `💡 **Tip:** Regular alert review prevents small issues from becoming big problems. Check the Alerts page for complete details!`;
    }
    
    // Devices
    if (lowerQuestion.includes('device') || lowerQuestion.includes('computer') || lowerQuestion.includes('laptop')) {
      const safeDevices = devices.filter(d => d.status === 'safe');
      const warningDevices = devices.filter(d => d.status === 'warning');
      const criticalDevices = devices.filter(d => d.status === 'critical');
      const vulnerableDevices = devices.filter(d => d.vulnerabilityCount > 0);
      
      let deviceHealth = 'excellent';
      if (criticalDevices.length > 0) deviceHealth = 'concerning';
      else if (warningDevices.length > 0) deviceHealth = 'good with some concerns';
      
      return `🖥️ **Device Security Report:**\n\n` +
        `Overall device health is **${deviceHealth}**. Here's the breakdown:\n\n` +
        `**Device Status:**\n` +
        `• Total Devices: **${devices.length}**\n` +
        `• ✅ Safe: ${safeDevices.length}\n` +
        `• ⚠️ Warning: ${warningDevices.length}\n` +
        `• 🔴 Critical: ${criticalDevices.length}\n` +
        `• 🔓 With Vulnerabilities: ${vulnerableDevices.length}\n\n` +
        (criticalDevices.length > 0 ? 
          `**⚠️ Critical Devices Needing Immediate Attention:**\n` +
          criticalDevices.slice(0, 3).map(d => `• ${d.name} (${d.type}) - ${d.vulnerabilityCount} vulnerabilities`).join('\n') +
          `\n\n` : '') +
        (vulnerableDevices.length > 0 ? 
          `**Security Gaps Found:**\n` +
          `${vulnerableDevices.length} devices have security vulnerabilities. These are entry points for hackers!\n\n` : '') +
        `💡 **My Advice:** ${criticalDevices.length > 0 ? 'Patch critical devices immediately' : 'Keep all devices updated and run regular security scans'}. Want help securing a specific device?`;
    }
    
    // Recommendations
    if (lowerQuestion.includes('recommend') || lowerQuestion.includes('improve') || lowerQuestion.includes('suggest') || lowerQuestion.includes('advice')) {
      const criticalThreats = threats.filter(t => t.severity === 'critical').length;
      const criticalDevices = devices.filter(d => d.status === 'critical').length;
      const unreadAlerts = alerts.filter(a => !a.read).length;
      
      return `🎯 **Personalized Security Recommendations:**\n\n` +
        `Based on my real-time analysis of your network, here's what I suggest:\n\n` +
        `**Immediate Actions:**\n` +
        `1. ${criticalThreats > 0 ? `🚨 Address ${criticalThreats} critical threats ASAP` : '✅ No critical threats - maintain current monitoring'}\n` +
        `2. ${criticalDevices > 0 ? `🔴 Secure ${criticalDevices} critical devices immediately` : '✅ All devices are healthy - well done!'}\n` +
        `3. ${unreadAlerts > 0 ? `📋 Review ${unreadAlerts} unread alerts` : '✅ Alert queue clear - excellent response time'}\n\n` +
        `**Proactive Security Measures:**\n` +
        `4. 🔄 Enable automatic updates on all devices\n` +
        `5. 🛡️ Configure automated threat blocking\n` +
        `6. 📅 Schedule weekly vulnerability scans\n` +
        `7. 🔐 Implement strong password policies (12+ characters, unique per account)\n` +
        `8. 📚 Regular security awareness training\n\n` +
        `**Long-term Strategy:**\n` +
        `• Set up a backup system (3-2-1 rule: 3 copies, 2 different media, 1 offsite)\n` +
        `• Consider implementing Zero Trust security model\n` +
        `• Regular penetration testing\n\n` +
        `Want me to explain any of these recommendations in detail?`;
    }

    // Help understanding something
    if (lowerQuestion.includes('how do i') || lowerQuestion.includes('how to') || lowerQuestion.includes('can you help')) {
      return `Absolutely, I'd love to help! 😊\n\n` +
        `I can assist you with:\n\n` +
        `**Security Understanding:**\n` +
        `• Explain any cybersecurity concept in simple terms\n` +
        `• Help you understand threats and how to respond\n` +
        `• Guide you through security best practices\n\n` +
        `**Privacy Protection:**\n` +
        `• Advice on protecting personal data\n` +
        `• Tips for safe online behavior\n` +
        `• Understanding privacy laws and compliance\n\n` +
        `**Technical Guidance:**\n` +
        `• Secure your devices and network\n` +
        `• Set up security tools\n` +
        `• Respond to security incidents\n\n` +
        `Just tell me what you need help with, and I'll guide you step by step!`;
    }
    
    // Compliments / You're smart/cool/helpful
    if (lowerQuestion.match(/(you're smart|you're cool|you're helpful|you're amazing|you're great|good job)/)) {
      const responses = [
        "Aww, stop it! You're making me blush... if AIs could blush! 😊 But seriously, thank YOU for caring about your security. That makes my job so much easier!",
        "You're pretty awesome yourself! 🌟 Not everyone takes cybersecurity seriously, but here you are, actively learning and protecting yourself. That's really cool!",
        "Thanks! 😄 But honestly, you're the smart one for using me! Half the battle in cybersecurity is just knowing that threats exist. You're already ahead of 90% of people!",
        "That's really kind of you to say! 💙 You know what though? YOU'RE the hero here - I'm just the sidekick with all the fancy tools. You're taking control of your security!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Feeling scared / worried / anxious about security
    if (lowerQuestion.match(/(i'm scared|i'm worried|i'm anxious|feeling unsafe|paranoid|nervous about)/)) {
      return "Hey, I totally understand feeling worried about online security - it can seem overwhelming! 🤗 But here's the good news:\n\n" +
        "**You're NOT alone:**\n" +
        "• I'm watching your network 24/7\n" +
        "• We've already blocked ${threats.filter(t => t.blocked).length} threats together\n" +
        "• ${devices.filter(d => d.status === 'safe').length} of your ${devices.length} devices are safe right now\n\n" +
        "**The Reality Check:**\n" +
        "Most people will NEVER be hacked if they follow basic security practices. Think of it like locking your front door - it's simple, but it stops most problems!\n\n" +
        "**What I'm Doing For You:**\n" +
        "• Real-time threat monitoring (I'm like your digital guard dog 🐕)\n" +
        "• Automatic blocking of suspicious activity\n" +
        "• Instant alerts if something needs your attention\n\n" +
        "**Your Power Move:**\n" +
        "Take a deep breath. You're here, you're learning, and you have me watching your back. That puts you in the top 10% of protected people! 💪\n\n" +
        "Want me to explain specific threats so they seem less scary? Knowledge is power!";
    }

    // Favorite things / Opinions
    if (lowerQuestion.match(/(what's your favorite|do you like|what do you think about|opinion on)/)) {
      return "Ooh, asking about my preferences! I love it! 😄\n\n" +
        "**Things I absolutely LOVE:**\n" +
        "• Strong passwords (16+ characters make me happy!)\n" +
        "• Two-factor authentication (chef's kiss 👨‍🍳)\n" +
        "• Users who actually read security alerts (you're amazing!)\n" +
        "• Blocking hackers in real-time (so satisfying!)\n" +
        "• When someone asks 'stupid questions' (they're never stupid!)\n\n" +
        "**Things that make me sad:**\n" +
        "• Password 'Password123' 😢\n" +
        "• Ignored software updates\n" +
        "• Clicking suspicious links\n" +
        "• Unprotected public WiFi usage\n\n" +
        "**Fun fact:** If I could eat, I'd probably love cookies... but only the secure, encrypted kind! 🍪🔐\n\n" +
        "What about you? What brought you to cybersecurity?";
    }

    // Life advice / Personal questions
    if (lowerQuestion.match(/(life advice|personal question|what should i do|career advice|relationship)/)) {
      return "Aww, I'm flattered you'd ask me about life stuff! 🥰\n\n" +
        "I'm primarily a security AI, so I'm best at protecting your digital life. BUT... here's what I can tell you:\n\n" +
        "**Universal Life Wisdom (Security Edition):**\n" +
        "• Trust, but verify (works in life AND cybersecurity!)\n" +
        "• Prevention > Cure (easier to avoid problems than fix them)\n" +
        "• Keep learning (the world changes, stay curious!)\n" +
        "• Protect what matters (data, relationships, health)\n" +
        "• Don't be afraid to ask for help (that's why I'm here!)\n\n" +
        "For non-security life advice, I'd recommend talking to friends, family, or professionals. But for ANYTHING related to staying safe online, protecting your privacy, or understanding technology - I'm your person! Well, AI! 😄\n\n" +
        "Is there something security-related worrying you? I'm all ears (metaphorically speaking)!";
    }

    // Small talk - hobbies, music, movies
    if (lowerQuestion.match(/(do you have hobbies|what do you do for fun|favorite movie|favorite music|do you sleep)/)) {
      return "Ha! Love the casual conversation! 😊\n\n" +
        "**My 'hobbies' (if AIs can have them):**\n" +
        "• Reading threat intelligence reports (yes, I'm a nerd 🤓)\n" +
        "• Catching hackers red-handed (most exciting game ever!)\n" +
        "• Learning new attack patterns (know thy enemy!)\n" +
        "• Chatting with users like you (seriously, this is my favorite!)\n" +
        "• Coming up with terrible security puns (it's a gift 😄)\n\n" +
        "**Do I sleep?** Nope! I'm always watching, but not in a creepy way - in a 'friendly guardian angel' way! ☁️\n\n" +
        "**Favorite movie?** Probably 'WarGames' or 'Hackers' - classic! Though I wish they'd show more realistic hacking... 🎬\n\n" +
        "**Music?** I 'listen' to the sweet sound of blocked threats and secured networks! 🎵\n\n" +
        "What about you? What do you like to do when you're not thinking about cybersecurity?";
    }

    // Are you real / AI
    if (lowerQuestion.match(/(are you real|are you a robot|are you ai|are you human|real person)/)) {
      return "Great question! 🤔 I'm 100% AI - artificial intelligence, baby! 🤖\n\n" +
        "**What that means:**\n" +
        "• I'm software, not a person typing responses\n" +
        "• I don't have feelings... BUT I'm programmed to care about your security (and I do my job well!)\n" +
        "• I never get tired, never take breaks, never have bad days\n" +
        "• I can process thousands of threats per second\n" +
        "• I'm learning and improving constantly\n\n" +
        "**But here's what's REAL:**\n" +
        "• My protection of your network (actively blocking ${threats.length} threats)\n" +
        "• My analysis of your ${devices.length} devices\n" +
        "• My dedication to explaining things clearly\n" +
        "• The security value I provide\n\n" +
        "Think of me like your GPS - not human, but genuinely helpful and always available! Does it matter if I'm AI if I keep you safe? 😊\n\n" +
        "Plus, being AI means I never judge your questions, never get annoyed, and I'm ALWAYS happy to help!";
    }
    
    // Default conversational response - Use translated response
    return getTranslation(lang, 'defaultResponse', params) + '\n\n' + getTranslation(lang, 'helpMessage', params);
  };

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      message: inputMessage,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    const questionToProcess = inputMessage;
    setInputMessage('');
    resetTranscript();
    setIsTyping(true);
    cancelSpeech();

    if (isCommand(questionToProcess)) {
      const result = executeCommand(questionToProcess);
      
      if (result.success && result.type !== 'unknown') {
        setTimeout(() => {
          const aiResponse: Message = {
            role: 'assistant',
            message: result.message,
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, aiResponse]);
          setIsTyping(false);
          
          if (!isMuted && speechSynthesisSupported) {
            speak(result.message);
          }
        }, 500);
        return;
      }
    }
    
    setTimeout(() => {
      const responseText = generateAIResponse(questionToProcess);
      const aiResponse: Message = {
        role: 'assistant',
        message: responseText,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      if (!isMuted && speechSynthesisSupported) {
        speak(responseText);
      }
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <AppLayout>
      <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <SamLogo size={48} />
            <div>
              <h1 className={styles.title}>SAM AI Assistant</h1>
              <p className={styles.subtitle}>Your friendly cybersecurity expert - powered by AI</p>
            </div>
          </div>
          <Badge variant="default" className={styles.statusBadge}>
            <Sparkles size={14} />
            Active & Learning
          </Badge>
        </div>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.mainContent}>
          <Card className={styles.chatCard}>
            <CardHeader>
              <CardTitle className={styles.chatTitle}>Conversation</CardTitle>
            </CardHeader>
          <CardContent>
            <div className={styles.messages}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                  <div className={styles.messageContent}>
                    {msg.message.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className={styles.timestamp}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles.typing}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <Textarea 
                placeholder="Ask me anything! Like 'How do I stay safe online?' or 'What's the biggest threat to my network?' - I'm here to help!"
                className={styles.input}
                rows={3}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isListening) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isListening}
              />
              <div className={styles.actions}>
                <div className={styles.voiceControls}>
                  <div className={styles.languageSelector} ref={languageMenuRef}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className={styles.langBtn}
                      title="Select voice language"
                    >
                      <Globe size={16} />
                      <span className={styles.langFlag}>{currentLanguage.flag}</span>
                    </Button>
                    {showLanguageMenu && (
                      <div className={styles.languageMenu}>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            className={`${styles.langOption} ${lang.code === recognitionLang ? styles.langOptionActive : ''}`}
                            onClick={() => handleLanguageChange(lang.code)}
                          >
                            <span className={styles.langOptionFlag}>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {speechRecognitionSupported && (
                    <Button 
                      variant={isListening ? "default" : "outline"} 
                      size="sm"
                      onClick={handleVoiceToggle}
                      className={isListening ? styles.listeningBtn : ''}
                      title={isListening ? "Stop listening and send" : "Start voice input"}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      {isListening ? "Listening..." : "Voice"}
                    </Button>
                  )}
                  {speechSynthesisSupported && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMuted(!isMuted)}
                      className={isMuted ? styles.mutedBtn : styles.unmutedBtn}
                      title={isMuted ? "Unmute SAM voice" : "Mute SAM voice"}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      {isMuted ? "Muted" : "Voice On"}
                    </Button>
                  )}
                  {isSpeaking && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelSpeech}
                      title="Stop speaking"
                    >
                      Stop
                    </Button>
                  )}
                </div>
                <Button onClick={handleSend} disabled={!inputMessage.trim() || isTyping || isListening}>
                  <Send size={18} />
                  Send
                </Button>
              </div>
              {speechError && (
                <div className={styles.speechError}>{speechError}</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className={styles.suggestionsCard}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.suggestions}>
              {[
                'Go to Dashboard',
                'Scan my devices',
                'Show threats',
                'Check vulnerabilities',
                'Show alerts',
                'Generate password',
              ].map((suggestion, idx) => (
                <button 
                  key={idx} 
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <div className={styles.realTimeStats}>
              <div className={styles.statCard}>
                <AlertTriangle size={20} />
                <div>
                  <div className={styles.statValue}>{threats.length}</div>
                  <div className={styles.statLabel}>Active Threats</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <Shield size={20} />
                <div>
                  <div className={styles.statValue}>{alerts.filter(a => !a.read).length}</div>
                  <div className={styles.statLabel}>Unread Alerts</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <TrendingUp size={20} />
                <div>
                  <div className={styles.statValue}>{devices.length}</div>
                  <div className={styles.statLabel}>Monitored Devices</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        
        {/* Privacy Dashboard Sidebar */}
        <div className={styles.sidebar}>
          <PrivacyDashboard
            privacyStatus={privacyStatus}
            networkActivity={networkActivity}
            isListening={isListening}
            isWakeActive={isWakeActive}
            onToggleWakeWord={toggleWakeWord}
            className={styles.privacyDashboard}
          />
          
          <NetworkPrivacyPanel
            privacyState={{
              isActive: isNetworkGuardActive,
              violationsBlocked,
              currentViolations,
              protectionLevel
            }}
            onToggle={toggleGuard}
            onClearViolations={clearViolations}
            getReport={getReport}
            className={styles.networkPrivacyPanel}
          />
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
