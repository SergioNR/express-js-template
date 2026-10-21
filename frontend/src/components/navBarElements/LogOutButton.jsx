import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { usePostHog } from 'posthog-js/react';
import { IconLogout } from '@tabler/icons-react';
import classes from '../partials/NavbarSimple.module.css';
import { notifyError } from '../../utils/notifications.js';

const analyticsEnabled = Boolean(import.meta.env.VITE_PUBLIC_POSTHOG_KEY);

const LogOutButton = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      notifyError(t('errors.logoutFailed'));
    } finally {
      // Reset PostHog to clear user session and prevent tracking continuity
      if (analyticsEnabled) {
        posthog?.reset();
      }

      // Leave the private area even when the server call failed
      navigate('/');
    }
  };

  return (
    <a className={classes.link} onClick={handleLogout}>
      <IconLogout className={classes.linkIcon} stroke={1.5} />
      <span>{t('nav.logout')}</span>
    </a>
  );
};

export default LogOutButton;
