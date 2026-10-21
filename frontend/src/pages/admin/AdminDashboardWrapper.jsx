import { Outlet, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from '@mantine/core';
import AdminNavBar from '../../components/partials/AdminNavBar.jsx';
import apiClient from '../../config/API/axiosConfig.mjs';
import PageLoader from '../../components/PageLoader.jsx';
import { SiteFooter } from '../../components/partials/SiteFooter';

export const AdminDashboardWrapper = () => {
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

  return (
    <div>
      <AdminNavBar />
      <Container size="xl" px="md" py="lg">
        <Outlet />
      </Container>
      <SiteFooter />
    </div>
  );
};

export default AdminDashboardWrapper;
