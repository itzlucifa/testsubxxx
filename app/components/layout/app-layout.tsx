import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Monitor,
  Bell,
  Settings,
  Search,
  MessageSquare,
  BarChart3,
  FileText,
  HelpCircle,
  Activity,
  Lock,
  ShieldAlert,
  FileSearch,
  Target,
  ScrollText,
  Scale,
  AlertTriangle,
  GraduationCap,
  Key,
  Wifi,
  ShieldCheck,
  Database,
  ChevronDown,
  ChevronRight,
  Bot,
  Workflow,
  Menu,
  X,
  CheckCircle,
  Zap,
  Shield,
} from "lucide-react";

import { NotificationContainer } from "../ui/notification-container/notification-container";
import { ProfileDropdown } from "../ui/profile-dropdown/profile-dropdown";
import { CyberLogo } from "../ui/cyber-logo";
import { useNotificationSystem } from "../../hooks/use-notification-system";
import { useRealTimeAlerts } from "../../hooks/use-real-time-alerts";
import type { User as UserType } from "../../types";
import { telegramService } from "../../lib/telegram-service";
import styles from "./app-layout.module.css";

interface AppLayoutProps {
  /**
   * The main content to display
   * @important
   */
  children: React.ReactNode;
  /**
   * Optional className for custom styling
   */
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  interface AppMessage {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    read: boolean;
    createdAt: Date;
  }
  
  const getInitialMessages = (): AppMessage[] => {
    const savedDeleted = typeof window !== 'undefined' ? localStorage.getItem('deletedMessageIds') : null;
    const deletedIds = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();
    
    const allMessages = [
      { id: 1, sender: 'Security Team', message: 'Critical vulnerability detected in production server', timestamp: '2 min ago', read: false, createdAt: new Date(Date.now() - 2 * 60000) },
      { id: 2, sender: 'Admin', message: 'System maintenance scheduled for tonight', timestamp: '1 hour ago', read: true, createdAt: new Date(Date.now() - 60 * 60000) },
      { id: 3, sender: 'SAM AI', message: 'Anomalous traffic pattern detected. Recommend investigation.', timestamp: '3 hours ago', read: true, createdAt: new Date(Date.now() - 3 * 60 * 60000) },
      { id: 4, sender: 'Support', message: 'Your ticket #1234 has been resolved', timestamp: '12 hours ago', read: true, createdAt: new Date(Date.now() - 12 * 60 * 60000) },
    ];
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return allMessages.filter(msg => 
      !deletedIds.has(msg.id) && new Date(msg.createdAt) > twentyFourHoursAgo
    );
  };
  
  const [messages, setMessages] = useState<AppMessage[]>(getInitialMessages);
  
  // Track deleted message IDs to prevent them from reappearing - persist to localStorage
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deletedMessageIds');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Persist deleted message IDs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('deletedMessageIds', JSON.stringify([...deletedMessageIds]));
    }
  }, [deletedMessageIds]);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Overview': true,
    'Monitoring & Detection': true,
    'AI & Automation': true,
    'Investigation & Testing': true,
    'Compliance & Governance': true,
    'Training & Utilities': true,
    'Infrastructure': true,
    'Reports & Analytics': true,
    'System': true,
  });

  // Function to clean old messages (older than 24 hours) and exclude deleted messages
  const cleanOldMessages = (messageList: Array<any>) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    return messageList.filter(msg => {
      // If createdAt is not defined, use current time as fallback
      const messageTime = msg.createdAt ? new Date(msg.createdAt) : new Date();
      
      // Filter out messages that are older than 24 hours
      const isRecent = messageTime > twentyFourHoursAgo;
      
      // Filter out messages that have been deleted
      const isNotDeleted = !deletedMessageIds.has(msg.id);
      
      return isRecent && isNotDeleted;
    });
  };

  // Effect to periodically clean old messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prevMessages => cleanOldMessages(prevMessages));
    }, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, []);

  // Initialize messages with cleaned data
  useEffect(() => {
    setMessages(prevMessages => cleanOldMessages(prevMessages));
  }, []);

  // Initialize Telegram service on component mount
  useEffect(() => {
    const initTelegramService = async () => {
      // Initialize the Telegram service
      const initialized = telegramService.initialize();
      
      if (initialized) {
        console.log('Telegram integration initialized');
        
        // Fetch initial messages if configured
        try {
          const telegramMessages = await telegramService.getIntegratableMessages();
          if (telegramMessages.length > 0) {
            setMessages(prev => {
              // Convert Telegram messages to AppMessage format
              const convertedMessages = telegramMessages
                .filter(tm => !deletedMessageIds.has(tm.id)) // Filter out deleted messages
                .map(tm => ({
                  id: tm.id,
                  sender: tm.sender,
                  message: tm.message,
                  timestamp: tm.timestamp,
                  read: tm.read,
                  createdAt: tm.createdAt || new Date(),
                }));
              
              // Combine existing messages with new Telegram messages
              const allMessages = [...convertedMessages, ...prev.filter(m => !deletedMessageIds.has(m.id))];
              // Remove duplicates by ID
              const uniqueMessages = allMessages.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
              );
              return uniqueMessages;
            });
          }
        } catch (error) {
          console.error('Error fetching initial Telegram messages:', error);
        }
      }
    };
    
    initTelegramService();
    
    // Clean up interval on unmount
    return () => {
      telegramService.stopPolling();
    };
  }, []);

  // Periodically fetch new Telegram messages
  useEffect(() => {
    const interval = setInterval(async () => {
      if (telegramService.isConfigured()) {
        try {
          const newMessages = await telegramService.getIntegratableMessages();
          if (newMessages.length > 0) {
            setMessages(prev => {
              // Convert Telegram messages to AppMessage format
              const convertedMessages = newMessages
                .filter(tm => !deletedMessageIds.has(tm.id)) // Filter out deleted messages
                .map(tm => ({
                  id: tm.id,
                  sender: tm.sender,
                  message: tm.message,
                  timestamp: tm.timestamp,
                  read: tm.read,
                  createdAt: tm.createdAt || new Date(),
                }));
              
              // Add new messages to the beginning of the list
              const allMessages = [...convertedMessages, ...prev.filter(m => !deletedMessageIds.has(m.id))];
              // Remove duplicates by ID
              const uniqueMessages = allMessages.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
              );
              return uniqueMessages;
            });
          }
        } catch (error) {
          console.error('Error fetching periodic Telegram messages:', error);
        }
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to configure Telegram integration
  const configureTelegram = (botToken: string, channelId: string) => {
    telegramService.configure(botToken, channelId);
    
    // Refresh messages after configuration
    if (telegramService.isConfigured()) {
      telegramService.getIntegratableMessages()
        .then(newMessages => {
          if (newMessages.length > 0) {
            setMessages(prev => {
              // Convert Telegram messages to AppMessage format
              const convertedMessages = newMessages
                .filter(tm => !deletedMessageIds.has(tm.id)) // Filter out deleted messages
                .map(tm => ({
                  id: tm.id,
                  sender: tm.sender,
                  message: tm.message,
                  timestamp: tm.timestamp,
                  read: tm.read,
                  createdAt: tm.createdAt || new Date(),
                }));
              
              const allMessages = [...convertedMessages, ...prev.filter(m => !deletedMessageIds.has(m.id))];
              const uniqueMessages = allMessages.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
              );
              return uniqueMessages;
            });
          }
        })
        .catch(error => {
          console.error('Error fetching messages after Telegram configuration:', error);
        });
    }
  };

  // Real-time notifications
  const { notifications, removeNotification, markAsRead } = useNotificationSystem(currentUser?.id);
  const { alerts } = useRealTimeAlerts(currentUser?.id);
  const unreadCount = alerts.filter(a => !a.read).length;

  useEffect(() => {
    // Check for user in localStorage first (for demo users)
    const localStorageUser = localStorage.getItem('currentUser');
    if (localStorageUser) {
      try {
        const user = JSON.parse(localStorageUser);
        setCurrentUser(user);
        return; // Found user in localStorage, no need to check Supabase
      } catch (e) {
        console.error('Error parsing localStorage user:', e);
      }
    }
    
    // If no user in localStorage, check Supabase
    if (typeof window !== 'undefined') {
      import('../../lib/auth').then(({ authService }) => {
        authService.getCurrentUser().then(user => {
          if (user) {
            setCurrentUser(user);
            // Also store in localStorage for consistency
            localStorage.setItem('currentUser', JSON.stringify(user));
          } else {
            // Allow demo mode - don't redirect, just set a demo user
            setCurrentUser({
              id: 'demo-user',
              username: 'Demo User',
              email: 'demo@cybershield.com',
              role: 'user',
              subscription: 'free',
              mfaEnabled: false,
              createdAt: new Date(),
              lastLogin: new Date(),
            });
          }
        }).catch(() => {
          // If Supabase fails, check localStorage again
          const fallbackUser = localStorage.getItem('currentUser');
          if (fallbackUser) {
            try {
              const user = JSON.parse(fallbackUser);
              setCurrentUser(user);
            } catch (e) {
              // Allow demo mode
              setCurrentUser({
                id: 'demo-user',
                username: 'Demo User',
                email: 'demo@cybershield.com',
                role: 'user',
                subscription: 'free',
                mfaEnabled: false,
                createdAt: new Date(),
                lastLogin: new Date(),
              });
            }
          } else {
            // Allow demo mode
            setCurrentUser({
              id: 'demo-user',
              username: 'Demo User',
              email: 'demo@cybershield.com',
              role: 'user',
              subscription: 'free',
              mfaEnabled: false,
              createdAt: new Date(),
              lastLogin: new Date(),
            });
          }
        });
      });
    }
  }, [navigate]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // Check if feature is available for current subscription
  const hasAccess = (requiredTier: 'free' | 'professional' | 'enterprise') => {
    if (!currentUser) return false;
    const tiers = ['free', 'professional', 'enterprise'];
    const userTierIndex = tiers.indexOf(currentUser.subscription);
    const requiredTierIndex = tiers.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  };

  const navSections = [
    {
      title: "Overview",
      items: [
        { path: "/", label: "Dashboard", icon: LayoutDashboard, tier: 'free' as const },
      ]
    },
    {
      title: "Monitoring & Detection",
      items: [
        { path: "/devices", label: "Devices", icon: Monitor, tier: 'free' as const },
        { path: "/network-monitor", label: "Network Monitor", icon: Activity, tier: 'professional' as const },
        { path: "/threats", label: "Threats", icon: ShieldAlert, tier: 'free' as const },
        { path: "/vulnerabilities", label: "Vulnerabilities", icon: AlertTriangle, tier: 'professional' as const },
        { path: "/alerts", label: "Alerts", icon: Bell, tier: 'free' as const },
      ]
    },
    {
      title: "AI & Automation",
      items: [
        { path: "/ai-assistant", label: "SAM AI Assistant", icon: Bot, tier: 'enterprise' as const },
        { path: "/soar", label: "SOAR Platform", icon: Workflow, tier: 'enterprise' as const },
      ]
    },
    {
      title: "Investigation & Testing",
      items: [
        { path: "/forensics", label: "Digital Forensics", icon: FileSearch, tier: 'enterprise' as const },
        { path: "/pentest", label: "Penetration Testing", icon: Target, tier: 'professional' as const },
      ]
    },
    {
      title: "Compliance & Governance",
      items: [
        { path: "/compliance", label: "Compliance", icon: ScrollText, tier: 'professional' as const },
        { path: "/policies", label: "Policies", icon: Scale, tier: 'professional' as const },
        { path: "/risk-assessment", label: "Risk Assessment", icon: AlertTriangle, tier: 'professional' as const },
      ]
    },
    {
      title: "Training & Utilities",
      items: [
        { path: "/training", label: "Security Training", icon: GraduationCap, tier: 'free' as const },
        { path: "/password-tools", label: "Password Tools", icon: Key, tier: 'free' as const },
        { path: "/wifi-scanner", label: "WiFi Scanner", icon: Wifi, tier: 'professional' as const },
      ]
    },
    {
      title: "Infrastructure",
      items: [
        { path: "/zero-trust", label: "Zero Trust", icon: ShieldCheck, tier: 'enterprise' as const },
        { path: "/asset-inventory", label: "Asset Inventory", icon: Database, tier: 'enterprise' as const },
      ]
    },
    {
      title: "Reports & Analytics",
      items: [
        { path: "/analytics", label: "Analytics", icon: BarChart3, tier: 'professional' as const },
        { path: "/reports", label: "Reports", icon: FileText, tier: 'free' as const },
      ]
    },
    {
      title: "System",
      items: [
        { path: "/settings", label: "Settings", icon: Settings, tier: 'free' as const },
        { path: "/help", label: "Help Center", icon: HelpCircle, tier: 'free' as const },
      ]
    },
  ];

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <button 
          className={styles.logo}
          onClick={() => setIsWalkthroughOpen(true)}
          aria-label="Open CyberShield Walkthrough"
        >
          <CyberLogo size="sm" />
          <span className={styles.logoText}>CYBERSHIELD</span>
        </button>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection(section.title)}
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                {expandedSections[section.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections[section.title] && (
                <ul className={styles.navList}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const locked = !hasAccess(item.tier);

                    return (
                      <li key={item.path} className={styles.navItem}>
                        <Link 
                          to={locked ? '#' : item.path} 
                          className={`${styles.navLink} ${isActive ? styles.active : ""} ${locked ? styles.locked : ""}`}
                          onClick={(e) => {
                            if (locked) {
                              e.preventDefault();
                            } else {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                        >
                          <Icon className={styles.navIcon} size={18} />
                          <span className={styles.navLabel}>{item.label}</span>
                          {locked && <Lock size={14} className={styles.lockIcon} />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className={styles.findButton}>
          <button 
            className={styles.findLink}
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={20} />
            <span>Find</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input type="search" placeholder="Search" className={styles.searchInput} />
          </div>

          <div className={styles.headerActions}>
            <Link to="/alerts" className={styles.iconButton} aria-label="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </Link>

            <button 
              className={styles.iconButton} 
              aria-label="Messages"
              onClick={() => setIsMessagesOpen(true)}
            >
              <MessageSquare size={20} />
              {messages.filter(m => !m.read).length > 0 && (
                <span className={styles.badge}>{messages.filter(m => !m.read).length}</span>
              )}
            </button>

            {currentUser && (
              <ProfileDropdown user={currentUser} onLogout={handleLogout} />
            )}
          </div>
        </header>

        <main className={`${styles.content} ${className || ""}`}>{children}</main>
      </div>

      {/* Search Dialog */}
      {isSearchOpen && (
        <div className={styles.searchDialog}>
          <div className={styles.searchDialogOverlay} onClick={() => setIsSearchOpen(false)} />
          <div className={styles.searchDialogContent}>
            <div className={styles.searchDialogHeader}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search features..."
                className={styles.searchDialogInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                className={styles.searchDialogClose}
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.searchResults}>
              {navSections.map((section) => {
                const filteredItems = section.items.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  section.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={section.title} className={styles.searchSection}>
                    <div className={styles.searchSectionTitle}>{section.title}</div>
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const locked = !hasAccess(item.tier);
                      
                      return (
                        <Link
                          key={item.path}
                          to={locked ? '#' : item.path}
                          className={`${styles.searchResultItem} ${locked ? styles.locked : ''}`}
                          onClick={(e) => {
                            if (locked) {
                              e.preventDefault();
                            } else {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              setIsMobileMenuOpen(false);
                            }
                          }}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                          {locked && <Lock size={14} className={styles.lockIcon} />}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
              {navSections.every(section => 
                section.items.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  section.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0
              ) && searchQuery && (
                <div className={styles.noResults}>
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Walkthrough Dialog */}
      {isWalkthroughOpen && (
        <div className={styles.walkthroughDialog}>
          <div className={styles.walkthroughOverlay} onClick={() => setIsWalkthroughOpen(false)} />
          <div className={styles.walkthroughContent}>
            <button 
              className={styles.walkthroughClose}
              onClick={() => {
                setIsWalkthroughOpen(false);
                setWalkthroughStep(0);
              }}
              aria-label="Close walkthrough"
            >
              <X size={24} />
            </button>

            {/* Step 0: Welcome */}
            {walkthroughStep === 0 && (
              <div className={styles.walkthroughStep}>
                <div className={styles.walkthroughHero}>
                  <div className={styles.walkthroughLogoLarge}>
                    <CyberLogo size="lg" />
                  </div>
                  <h1 className={styles.walkthroughMainTitle}>Welcome to CyberShield</h1>
                  <p className={styles.walkthroughSubtitle}>Your Autonomous Cybersecurity Platform</p>
                </div>
                <div className={styles.walkthroughBody}>
                  <p className={styles.walkthroughIntro}>
                    CyberShield is an advanced, AI-powered cybersecurity platform designed to protect homes, small businesses, and enterprises from evolving cyber threats. Our autonomous system provides real-time monitoring, intelligent threat detection, and automated response capabilities.
                  </p>
                  <div className={styles.walkthroughFeatureGrid}>
                    <div className={styles.walkthroughFeatureBox}>
                      <Shield size={32} />
                      <h3>AI-Powered Protection</h3>
                      <p>Advanced machine learning algorithms detect and neutralize threats before they cause harm</p>
                    </div>
                    <div className={styles.walkthroughFeatureBox}>
                      <Activity size={32} />
                      <h3>Real-Time Monitoring</h3>
                      <p>24/7 surveillance of your network, devices, and digital infrastructure</p>
                    </div>
                    <div className={styles.walkthroughFeatureBox}>
                      <Workflow size={32} />
                      <h3>Automated Response</h3>
                      <p>Instant threat mitigation with our SOAR platform and intelligent automation</p>
                    </div>
                  </div>
                </div>
                <div className={styles.walkthroughFooter}>
                  <button onClick={() => setWalkthroughStep(1)} className={styles.walkthroughPrimaryButton}>
                    Learn More
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Why CyberShield is Important */}
            {walkthroughStep === 1 && (
              <div className={styles.walkthroughStep}>
                <h2 className={styles.walkthroughTitle}>Why CyberShield is Critical</h2>
                <div className={styles.walkthroughBody}>
                  <div className={styles.walkthroughImportance}>
                    <div className={styles.importanceItem}>
                      <div className={styles.importanceIcon}>
                        <AlertTriangle size={40} />
                      </div>
                      <div className={styles.importanceContent}>
                        <h3>Rising Cyber Threats</h3>
                        <p>Cybercrime damages are projected to reach $10.5 trillion annually by 2025. Attacks are becoming more sophisticated, targeting individuals, businesses, and critical infrastructure.</p>
                      </div>
                    </div>
                    <div className={styles.importanceItem}>
                      <div className={styles.importanceIcon}>
                        <Database size={40} />
                      </div>
                      <div className={styles.importanceContent}>
                        <h3>Data Breach Epidemic</h3>
                        <p>On average, a data breach costs $4.45 million. Every 39 seconds, there is a cyber attack somewhere in the world. Your data is constantly at risk.</p>
                      </div>
                    </div>
                    <div className={styles.importanceItem}>
                      <div className={styles.importanceIcon}>
                        <Target size={40} />
                      </div>
                      <div className={styles.importanceContent}>
                        <h3>Small Businesses Targeted</h3>
                        <p>43% of cyber attacks target small businesses, yet only 14% are prepared. Traditional security is insufficient against modern threats.</p>
                      </div>
                    </div>
                    <div className={styles.importanceItem}>
                      <div className={styles.importanceIcon}>
                        <ShieldCheck size={40} />
                      </div>
                      <div className={styles.importanceContent}>
                        <h3>CyberShield's Solution</h3>
                        <p>Our AI-driven platform provides enterprise-grade security accessible to everyone. Autonomous threat detection, real-time response, and comprehensive protection—all automated.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.walkthroughFooter}>
                  <button onClick={() => setWalkthroughStep(0)} className={styles.walkthroughSecondaryButton}>
                    Back
                  </button>
                  <button onClick={() => setWalkthroughStep(2)} className={styles.walkthroughPrimaryButton}>
                    Explore Features
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Features Overview */}
            {walkthroughStep === 2 && (
              <div className={styles.walkthroughStep}>
                <h2 className={styles.walkthroughTitle}>Comprehensive Feature Set</h2>
                <div className={styles.walkthroughBody}>
                  <div className={styles.featuresList}>
                    <div className={styles.featureCategory}>
                      <h3>Monitoring & Detection</h3>
                      <ul>
                        <li><Monitor size={16} /> <strong>Device Management:</strong> Track and secure all connected devices</li>
                        <li><Activity size={16} /> <strong>Network Monitor:</strong> Real-time network traffic analysis and anomaly detection</li>
                        <li><ShieldAlert size={16} /> <strong>Threat Detection:</strong> AI-powered identification of malware, ransomware, and intrusions</li>
                        <li><AlertTriangle size={16} /> <strong>Vulnerability Scanner:</strong> Continuous assessment of system weaknesses</li>
                        <li><Bell size={16} /> <strong>Smart Alerts:</strong> Intelligent notifications prioritized by severity</li>
                      </ul>
                    </div>
                    <div className={styles.featureCategory}>
                      <h3>AI & Automation</h3>
                      <ul>
                        <li><Bot size={16} /> <strong>SAM AI Assistant:</strong> Your personal cybersecurity expert powered by advanced AI</li>
                        <li><Workflow size={16} /> <strong>SOAR Platform:</strong> Security Orchestration, Automation, and Response</li>
                      </ul>
                    </div>
                    <div className={styles.featureCategory}>
                      <h3>Investigation & Testing</h3>
                      <ul>
                        <li><FileSearch size={16} /> <strong>Digital Forensics:</strong> Deep analysis of security incidents</li>
                        <li><Target size={16} /> <strong>Penetration Testing:</strong> Proactive vulnerability discovery</li>
                      </ul>
                    </div>
                    <div className={styles.featureCategory}>
                      <h3>Compliance & Governance</h3>
                      <ul>
                        <li><ScrollText size={16} /> <strong>Compliance Dashboard:</strong> GDPR, HIPAA, ISO 27001, PCI-DSS tracking</li>
                        <li><Scale size={16} /> <strong>Policy Management:</strong> Create and enforce security policies</li>
                        <li><AlertTriangle size={16} /> <strong>Risk Assessment:</strong> Quantify and prioritize security risks</li>
                      </ul>
                    </div>
                    <div className={styles.featureCategory}>
                      <h3>Additional Tools</h3>
                      <ul>
                        <li><GraduationCap size={16} /> <strong>Security Training:</strong> Interactive cybersecurity education</li>
                        <li><Key size={16} /> <strong>Password Tools:</strong> Generator, strength checker, breach database</li>
                        <li><Wifi size={16} /> <strong>WiFi Scanner:</strong> Detect unauthorized access points</li>
                        <li><ShieldCheck size={16} /> <strong>Zero Trust Architecture:</strong> Modern security framework</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className={styles.walkthroughFooter}>
                  <button onClick={() => setWalkthroughStep(1)} className={styles.walkthroughSecondaryButton}>
                    Back
                  </button>
                  <button onClick={() => setWalkthroughStep(3)} className={styles.walkthroughPrimaryButton}>
                    How to Use
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: How to Operate */}
            {walkthroughStep === 3 && (
              <div className={styles.walkthroughStep}>
                <h2 className={styles.walkthroughTitle}>Operating CyberShield</h2>
                <div className={styles.walkthroughBody}>
                  <div className={styles.operationGuide}>
                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>1</div>
                      <div className={styles.operationContent}>
                        <h3>Dashboard Overview</h3>
                        <p>Your home dashboard provides a real-time security status. The main shield icon indicates your current protection level:</p>
                        <ul>
                          <li><Shield size={16} className={styles.safeIcon} /> <strong>Green Shield:</strong> System is secure</li>
                          <li><AlertTriangle size={16} className={styles.warningIcon} /> <strong>Yellow/Red Alert:</strong> Action required</li>
                        </ul>
                        <p>View connected devices, active threats, unread alerts, and vulnerability counts at a glance.</p>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>2</div>
                      <div className={styles.operationContent}>
                        <h3>Navigation & Search</h3>
                        <p>Access features through the sidebar menu:</p>
                        <ul>
                          <li>Click sections to expand/collapse feature groups</li>
                          <li>Use the <strong>Find</strong> button (bottom of sidebar) for quick feature search</li>
                          <li>Locked features require subscription upgrade (Professional/Enterprise)</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>3</div>
                      <div className={styles.operationContent}>
                        <h3>Monitoring Devices</h3>
                        <p>Go to <strong>Devices</strong> to:</p>
                        <ul>
                          <li>View all connected devices on your network</li>
                          <li>Check device status (Online, Warning, Critical)</li>
                          <li>Add or remove devices manually</li>
                          <li>Set device permissions and security policies</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>4</div>
                      <div className={styles.operationContent}>
                        <h3>Handling Threats & Alerts</h3>
                        <p>CyberShield automatically detects threats:</p>
                        <ul>
                          <li><strong>Alerts:</strong> View all notifications in the Alerts page</li>
                          <li><strong>Threats:</strong> See detected malware, intrusions, and suspicious activity</li>
                          <li><strong>Vulnerabilities:</strong> Review system weaknesses and apply patches</li>
                          <li>Click any alert for detailed information and recommended actions</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>5</div>
                      <div className={styles.operationContent}>
                        <h3>AI Assistant (SAM)</h3>
                        <p>Your intelligent security advisor:</p>
                        <ul>
                          <li>Ask questions about security threats</li>
                          <li>Get instant recommendations for vulnerabilities</li>
                          <li>Receive step-by-step guidance for incident response</li>
                          <li>Available 24/7 for cybersecurity queries</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>6</div>
                      <div className={styles.operationContent}>
                        <h3>Automated Protection (SOAR)</h3>
                        <p>The SOAR platform handles threats automatically:</p>
                        <ul>
                          <li>Creates automated playbooks for common threats</li>
                          <li>Executes incident response without manual intervention</li>
                          <li>Quarantines suspicious files and blocks malicious IPs</li>
                          <li>Logs all actions for compliance and audit trails</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>7</div>
                      <div className={styles.operationContent}>
                        <h3>Reports & Analytics</h3>
                        <p>Track security performance:</p>
                        <ul>
                          <li><strong>Analytics:</strong> View trends, charts, and security metrics</li>
                          <li><strong>Reports:</strong> Generate compliance and executive reports</li>
                          <li>Export data for external audits</li>
                          <li>Schedule automated report delivery</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.operationSection}>
                      <div className={styles.operationNumber}>8</div>
                      <div className={styles.operationContent}>
                        <h3>Settings & Customization</h3>
                        <p>Personalize your security experience:</p>
                        <ul>
                          <li>Configure notification preferences</li>
                          <li>Set alert thresholds and severity filters</li>
                          <li>Manage user accounts and permissions</li>
                          <li>Customize security policies per device/network</li>
                          <li>Upgrade subscription for advanced features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.walkthroughFooter}>
                  <button onClick={() => setWalkthroughStep(2)} className={styles.walkthroughSecondaryButton}>
                    Back
                  </button>
                  <button onClick={() => setWalkthroughStep(4)} className={styles.walkthroughPrimaryButton}>
                    Best Practices
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Best Practices & Tips */}
            {walkthroughStep === 4 && (
              <div className={styles.walkthroughStep}>
                <h2 className={styles.walkthroughTitle}>Security Best Practices</h2>
                <div className={styles.walkthroughBody}>
                  <div className={styles.bestPractices}>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Regular Monitoring</h3>
                      <p>Check your dashboard daily. Review alerts immediately. Stay informed about your security posture.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Update Devices</h3>
                      <p>Keep all devices and software up to date. Apply security patches promptly when recommended by CyberShield.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Strong Passwords</h3>
                      <p>Use the Password Tools to generate and manage secure passwords. Enable two-factor authentication wherever possible.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Train Your Team</h3>
                      <p>Complete Security Training modules. Educate family members or employees about phishing, social engineering, and safe browsing.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Trust the AI</h3>
                      <p>SAM AI and SOAR automation are designed to protect you. Review their recommendations and let them handle routine threats automatically.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <CheckCircle size={32} />
                      <h3>Regular Scans</h3>
                      <p>Run vulnerability scans weekly. Use WiFi Scanner to detect rogue access points. Perform penetration tests quarterly.</p>
                    </div>
                  </div>
                  
                  <div className={styles.quickTips}>
                    <h3>Quick Tips</h3>
                    <ul>
                      <li>Use the top-right search bar for quick feature access</li>
                      <li>Check Messages (MessageSquare icon) for team communications</li>
                      <li>Bell icon shows unread alerts—clear them regularly</li>
                      <li>Click your profile (top-right) to manage account settings</li>
                      <li>Hover over locked features to see required subscription tier</li>
                      <li>Export reports for compliance audits and stakeholder updates</li>
                    </ul>
                  </div>
                </div>
                <div className={styles.walkthroughFooter}>
                  <button onClick={() => setWalkthroughStep(3)} className={styles.walkthroughSecondaryButton}>
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      setIsWalkthroughOpen(false);
                      setWalkthroughStep(0);
                    }} 
                    className={styles.walkthroughPrimaryButton}
                  >
                    Start Protecting
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Step Indicators */}
          <div className={styles.stepIndicators}>
            {[0, 1, 2, 3, 4].map((step) => (
              <button
                key={step}
                className={`${styles.stepDot} ${walkthroughStep === step ? styles.active : ''}`}
                onClick={() => setWalkthroughStep(step)}
                aria-label={`Go to step ${step + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Messages Dialog */}
      {isMessagesOpen && (
        <div className={styles.messagesDialog}>
          <div className={styles.messagesDialogOverlay} onClick={() => setIsMessagesOpen(false)} />
          <div className={styles.messagesDialogContent}>
            <div className={styles.messagesDialogHeader}>
              <div className={styles.messagesDialogTitle}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </div>
              <button 
                className={styles.messagesDialogClose}
                onClick={() => setIsMessagesOpen(false)}
                aria-label="Close messages"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.messagesList}>
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.messageItem} ${!msg.read ? styles.unread : ''}`}
                  onClick={() => {
                    setMessages(prev => prev.map(m => 
                      m.id === msg.id ? { ...m, read: true } : m
                    ));
                  }}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.messageSender}>{msg.sender}</span>
                    <span className={styles.messageTimestamp}>{msg.timestamp}</span>
                    <button 
                      className={styles.deleteMessageBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this message?')) {
                          // Add the message ID to the deleted set
                          setDeletedMessageIds(prev => new Set(prev).add(msg.id));
                          
                          // Remove the message from the current list
                          setMessages(prev => prev.filter(m => m.id !== msg.id));
                        }
                      }}
                      aria-label="Delete message"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.messageText}>{msg.message}</div>
                  {!msg.read && <div className={styles.unreadDot} />}
                </div>
              ))}
            </div>
            <div className={styles.messageInput}>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && messageInput.trim()) {
                    // Add message to local list
                    const newMessage = {
                      id: Date.now(),
                      sender: 'You',
                      message: messageInput,
                      timestamp: 'Just now',
                      read: true,
                      createdAt: new Date()
                    };
                    setMessages(prev => [newMessage, ...prev]);
                    
                    // If Telegram is configured, send message to channel
                    if (telegramService.isConfigured()) {
                      telegramService.sendMessageToChannel(messageInput)
                        .then(success => {
                          if (success) {
                            console.log('Message sent to Telegram channel successfully');
                          } else {
                            console.error('Failed to send message to Telegram channel');
                          }
                        });
                    }
                    
                    setMessageInput('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (messageInput.trim()) {
                    // Add message to local list
                    const newMessage = {
                      id: Date.now(),
                      sender: 'You',
                      message: messageInput,
                      timestamp: 'Just now',
                      read: true,
                      createdAt: new Date()
                    };
                    setMessages(prev => [newMessage, ...prev]);
                    
                    // If Telegram is configured, send message to channel
                    if (telegramService.isConfigured()) {
                      telegramService.sendMessageToChannel(messageInput)
                        .then(success => {
                          if (success) {
                            console.log('Message sent to Telegram channel successfully');
                          } else {
                            console.error('Failed to send message to Telegram channel');
                          }
                        });
                    }
                    
                    setMessageInput('');
                  }
                }}
                disabled={!messageInput.trim()}
              >
                Send
              </button>
            </div>
            
            {/* Telegram Configuration Section - Collapsible */}
            <div className={styles.telegramConfig}>
              <button 
                className={styles.telegramToggle}
                onClick={() => setShowTelegramConfig(!showTelegramConfig)}
              >
                <span>Telegram Integration</span>
                <ChevronDown size={16} style={{ transform: showTelegramConfig ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              
              {showTelegramConfig && (
                <div className={styles.telegramConfigContent}>
                  <p>Connect your Telegram channel to receive messages.</p>
                  
                  <div className={styles.telegramConfigFields}>
                    <input
                      type="password"
                      id="telegramBotToken"
                      placeholder="Enter Telegram Bot Token"
                      defaultValue={localStorage.getItem('telegramBotToken') || ''}
                    />
                    <input
                      type="text"
                      id="telegramChannelId"
                      placeholder="Enter Telegram Channel ID"
                      defaultValue={localStorage.getItem('telegramChannelId') || ''}
                    />
                    <button 
                      onClick={() => {
                        const botToken = (document.getElementById('telegramBotToken') as HTMLInputElement)?.value;
                        const channelId = (document.getElementById('telegramChannelId') as HTMLInputElement)?.value;
                        
                        if (botToken && channelId) {
                          configureTelegram(botToken, channelId);
                          alert('Telegram integration configured successfully!');
                        } else {
                          alert('Please enter both Bot Token and Channel ID');
                        }
                      }}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Toasts */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
}
