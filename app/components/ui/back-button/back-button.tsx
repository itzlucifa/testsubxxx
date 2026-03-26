import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import styles from './back-button.module.css';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
}

export function BackButton({ fallbackPath = '/', label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button className={styles.backButton} onClick={handleClick} type="button">
      <ArrowLeft size={18} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default BackButton;
