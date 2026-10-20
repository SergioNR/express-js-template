import { Outlet, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from '@mantine/core';
import AdminNavBar from '../../components/partials/AdminNavBar.jsx';
import apiClient from '../../config/API/axiosConfig.mjs';
import PageLoader from '../../components/PageLoader.jsx';
import { SiteFooter } from '../../components/partials/SiteFooter';

export const AdminDashboardWrapper = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiClient.get(`/api/v1/auth/session`);

        setLoading(false);
      } catch {
        setLoading(false);
        navigate('/auth/login');
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
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
