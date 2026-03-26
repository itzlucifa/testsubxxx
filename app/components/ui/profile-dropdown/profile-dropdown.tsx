import { useState } from "react";
import { User, Mail, Phone, Calendar, Crown, Shield, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import type { User as UserType } from "../../../types";
import styles from "./profile-dropdown.module.css";

interface ProfileDropdownProps {
  user: UserType;
  onLogout: () => void;
  className?: string;
}

export function ProfileDropdown({ user, onLogout, className }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate("/settings");
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile menu"
      >
        <div className={styles.avatar}>
          <User size={18} />
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.username}</span>
          <span className={styles.userTier}>
            {user.subscription === 'enterprise' && <Crown size={12} />}
            {user.subscription.toUpperCase()}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <div className={styles.headerAvatar}>
                <User size={32} />
              </div>
              <div className={styles.headerInfo}>
                <h3 className={styles.headerName}>{user.username}</h3>
                <div className={styles.subscriptionBadge}>
                  {user.subscription === 'enterprise' && <Crown size={14} />}
                  {user.subscription === 'professional' && <Shield size={14} />}
                  <span>{user.subscription.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <div className={styles.infoItem}>
                <Mail size={16} className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{user.email}</span>
                </div>
              </div>

              {user.phone && (
                <div className={styles.infoItem}>
                  <Phone size={16} className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{user.phone}</span>
                  </div>
                </div>
              )}

              <div className={styles.infoItem}>
                <Calendar size={16} className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Member Since</span>
                  <span className={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.actions}>
              <button className={styles.actionButton} onClick={handleSettingsClick}>
                <Settings size={16} />
                <span>Account Settings</span>
              </button>
              <button className={styles.actionButton} onClick={handleLogoutClick}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
