import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLayoutDashboard, IconUsers, IconBuilding } from '@tabler/icons-react';
import apiClient from '../../config/API/axiosConfig.mjs';
import PageLoader from '../../components/PageLoader.jsx';
import AreaShell from '../../components/partials/AreaShell.jsx';

export const AdminDashboardWrapper = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/session');

        if (cancelled) {
          return;
        }

        if (response.data?.user?.role === 'superadmin') {
          setAuthorized(true);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate('/auth/login', { replace: true });
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!authorized) {
    return <PageLoader />;
  }

  const links = [
    { to: '/admin', label: t('admin.nav.overview'), icon: IconLayoutDashboard, end: true },
    { to: '/admin/users', label: t('admin.nav.users'), icon: IconUsers },
    { to: '/admin/companies', label: t('admin.nav.companies'), icon: IconBuilding },
  ];

  return <AreaShell homeTo="/admin" title={t('admin.areaTitle')} links={links} />;
};

export default AdminDashboardWrapper;
