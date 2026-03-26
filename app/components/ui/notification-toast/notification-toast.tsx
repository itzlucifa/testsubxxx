import { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle, MessageCircle } from 'lucide-react';
import type { Alert } from '../../../types';
import styles from './notification-toast.module.css';

interface NotificationToastProps {
  alert: Alert;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationToast({ alert, onClose, onMarkAsRead }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto dismiss after 8 seconds
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = () => {
    if (!alert.read) {
      onMarkAsRead(alert.id);
    }
  };

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle size={20} />;
      case 'medium':
        return <Bell size={20} />;
      case 'low':
        return <Info size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  return (
    <div 
      className={`${styles.toast} ${styles[alert.severity]} ${isVisible ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}
      onClick={handleClick}
    >
      <div className={styles.iconContainer}>
        {getSeverityIcon()}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{alert.title}</h4>
          <button 
            className={styles.closeButton} 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className={styles.message}>{alert.message}</p>
        
        <div className={styles.footer}>
          <span className={styles.time}>
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
          {alert.whatsappSent && (
            <span className={styles.whatsappBadge}>
              <MessageCircle size={12} />
              WhatsApp
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
