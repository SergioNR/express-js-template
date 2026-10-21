import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { usePostHog } from 'posthog-js/react';
import {
  IconHomeFilled,
  IconUserCircle,
  IconCreditCardFilled,
  IconUsersGroup
} from '@tabler/icons-react';
import AreaShell from '../../components/partials/AreaShell.jsx';
import PageLoader from '../../components/PageLoader.jsx';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext.jsx';

const UserWrapper = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/session');

        if (!cancelled) {
          setUserId(response.data.user.id);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          navigate('/auth/login', { replace: true });
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      posthog?.identify(userId, {});
    }
  }, [userId, posthog]);

  const links = [
    { to: '/dashboard', label: t('nav.user.dashboard'), icon: IconHomeFilled },
    { to: '/user/profile', label: t('nav.user.profile'), icon: IconUserCircle },
    { to: '/user/billing', label: t('nav.user.plans'), icon: IconCreditCardFilled },
    { to: '/user/team', label: t('nav.user.team'), icon: IconUsersGroup },
  ];

  //* Nothing (including SubscriptionProvider's billing fetch) mounts until the
  //* session check passes
  if (loading) {
    return <PageLoader />;
  }

  return (
    <SubscriptionProvider>
      <AreaShell homeTo="/dashboard" title={t('user.panelTitle')} links={links} />
    </SubscriptionProvider>
  );
};

export default UserWrapper;
