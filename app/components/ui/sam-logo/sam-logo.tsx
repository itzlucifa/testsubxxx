import styles from './sam-logo.module.css';

interface SamLogoProps {
  size?: number;
  className?: string;
}

export function SamLogo({ size = 48, className = '' }: SamLogoProps) {
  return (
    <div 
      className={`${styles.container} ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={styles.outerRing}>
        <div className={styles.ringSegment} style={{ '--delay': '0s' } as React.CSSProperties} />
        <div className={styles.ringSegment} style={{ '--delay': '0.5s' } as React.CSSProperties} />
        <div className={styles.ringSegment} style={{ '--delay': '1s' } as React.CSSProperties} />
      </div>
      
      <div className={styles.middleRing}>
        <div className={styles.pulseRing} />
      </div>
      
      <div className={styles.core}>
        <div className={styles.brainCircuit}>
          <svg viewBox="0 0 24 24" fill="none" className={styles.brainIcon}>
            <path 
              d="M12 2C8.5 2 6 4.5 6 7.5C6 9 6.5 10 7.5 11C6.5 12 6 13.5 6 15C6 18 8.5 20.5 12 22C15.5 20.5 18 18 18 15C18 13.5 17.5 12 16.5 11C17.5 10 18 9 18 7.5C18 4.5 15.5 2 12 2Z"
              className={styles.brainPath}
            />
            <circle cx="9" cy="8" r="1" className={styles.neuron} style={{ '--neuron-delay': '0s' } as React.CSSProperties} />
            <circle cx="15" cy="8" r="1" className={styles.neuron} style={{ '--neuron-delay': '0.3s' } as React.CSSProperties} />
            <circle cx="12" cy="12" r="1.5" className={styles.neuron} style={{ '--neuron-delay': '0.6s' } as React.CSSProperties} />
            <circle cx="9" cy="16" r="1" className={styles.neuron} style={{ '--neuron-delay': '0.9s' } as React.CSSProperties} />
            <circle cx="15" cy="16" r="1" className={styles.neuron} style={{ '--neuron-delay': '1.2s' } as React.CSSProperties} />
            <line x1="9" y1="8" x2="12" y2="12" className={styles.connection} />
            <line x1="15" y1="8" x2="12" y2="12" className={styles.connection} />
            <line x1="12" y1="12" x2="9" y2="16" className={styles.connection} />
            <line x1="12" y1="12" x2="15" y2="16" className={styles.connection} />
          </svg>
        </div>
        <div className={styles.coreGlow} />
      </div>
      
      <div className={styles.dataOrbit}>
        <div className={styles.dataParticle} style={{ '--orbit-delay': '0s' } as React.CSSProperties} />
        <div className={styles.dataParticle} style={{ '--orbit-delay': '1s' } as React.CSSProperties} />
        <div className={styles.dataParticle} style={{ '--orbit-delay': '2s' } as React.CSSProperties} />
      </div>
    </div>
  );
}
