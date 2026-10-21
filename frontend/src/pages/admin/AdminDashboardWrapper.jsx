import { Outlet, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from '@mantine/core';
import AdminNavBar from '../../components/partials/AdminNavBar.jsx';
import apiClient from '../../config/API/axiosConfig.mjs';
import PageLoader from '../../components/PageLoader.jsx';
import SessionCheckError from '../../components/SessionCheckError.jsx';
import { SiteFooter } from '../../components/partials/SiteFooter';

export const AdminDashboardWrapper = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setError(false);

      try {
        const response = await apiClient.get('/api/v1/auth/session');

        if (cancelled) {
          return;
        }

        if (response.data?.user?.role === 'superadmin') {
          setSessionUser(response.data.user);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        //* Only a rejected session sends the user to login; a network/server
        //* error keeps them here with a retry
        if (err?.response?.status === 401) {
          navigate('/auth/login', { replace: true });
        } else {
          setError(true);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, attempt]);

  if (error) {
    return <SessionCheckError onRetry={() => setAttempt((n) => n + 1)} />;
  }

  if (!sessionUser) {
    return <PageLoader />;
  }

  return (
    <div>
      <AdminNavBar />
      <Container size="xl" px="md" py="lg">
        {/* Child pages read the signed-in admin via useOutletContext() */}
        <Outlet context={{ sessionUser }} />
      </Container>
      <SiteFooter />
    </div>
  );
};

export default AdminDashboardWrapper;
