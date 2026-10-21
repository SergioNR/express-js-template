import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';

import PasswordUpdateForm from '../../components/auth/PasswordUpdateForm';
import {
  Box,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import PageLoader from '../../components/PageLoader.jsx';
import Seo from '../../components/Seo.jsx';
import { AccountActionsForm } from './AccountActionsForm';

const CustomerProfile = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await apiClient.get(`/api/v1/user`);

        setLoading(false);
      } catch {
        setError(t('user.profile.loadError'));
        setLoading(false);
      }
    };

    fetchUser();
  }, [t]);

  if (loading) {
    return (
      <Box mx="auto" mt="xl">
        <Seo title={t('seo.pages.profile')} />
        <PageLoader label={t('loading.user')} />
      </Box>
    );
  }

  if (error) return (
    <Box maw={600} mx="auto" mt="xl">
      <Seo title={t('seo.pages.profile')} />
      <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red">
        {error}
      </Alert>
    </Box>
  );

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Seo title={t('seo.pages.profile')} />
      <PasswordUpdateForm />
      <AccountActionsForm />
    </Box>
  );
};

export default CustomerProfile;
