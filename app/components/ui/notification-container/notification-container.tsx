import { NotificationToast } from '../notification-toast/notification-toast';
import type { Alert } from '../../../types';
import styles from './notification-container.module.css';

interface NotificationContainerProps {
  notifications: Alert[];
  onClose: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose, onMarkAsRead }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          alert={notification}
          onClose={() => onClose(notification.id)}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}
