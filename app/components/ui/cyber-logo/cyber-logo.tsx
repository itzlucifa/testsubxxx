import styles from './cyber-logo.module.css';

interface CyberLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export function CyberLogo({ size = 'md', animated = true }: CyberLogoProps) {
  const sizeMap = {
    sm: 36,
    md: 48,
    lg: 72,
    xl: 96
  };
  
  const dimension = sizeMap[size];
  
  return (
    <div 
      className={`${styles.logoContainer} ${animated ? styles.animated : ''}`}
      style={{ width: dimension, height: dimension }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className={styles.logo}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0077aa" />
          </linearGradient>
          
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0099cc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="innerGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#001a2e" />
            <stop offset="100%" stopColor="#00111a" />
          </linearGradient>
          
          <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g className={styles.outerHexRing}>
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="1"
          />
        </g>

        <g className={styles.mainHex} filter="url(#coreGlow)">
          <polygon
            points="50,12 83,32 83,68 50,88 17,68 17,32"
            fill="url(#innerGradient)"
            stroke="url(#coreGradient)"
            strokeWidth="2"
          />
        </g>

        <g className={styles.circuitLines}>
          <line x1="50" y1="32" x2="50" y2="20" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="50" y1="68" x2="50" y2="80" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="32" y1="40" x2="22" y2="35" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="68" y1="40" x2="78" y2="35" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="32" y1="60" x2="22" y2="65" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="68" y1="60" x2="78" y2="65" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
        </g>

        <g className={styles.innerCore} filter="url(#coreGlow)">
          <polygon
            points="50,35 62,42.5 62,57.5 50,65 38,57.5 38,42.5"
            fill="url(#coreGradient)"
            opacity="0.9"
          />
        </g>

        <g className={styles.lockIcon}>
          <rect x="45" y="48" width="10" height="8" rx="1" fill="#001a2e" stroke="#00e5ff" strokeWidth="1"/>
          <path d="M47 48 L47 45 C47 42 53 42 53 45 L53 48" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        <g className={styles.cornerNodes}>
          <circle cx="50" cy="12" r="2" fill="#00e5ff" />
          <circle cx="83" cy="32" r="1.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="83" cy="68" r="1.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="50" cy="88" r="2" fill="#00e5ff" />
          <circle cx="17" cy="68" r="1.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="17" cy="32" r="1.5" fill="#00d4ff" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

export default CyberLogo;
