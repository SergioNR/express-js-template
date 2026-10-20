import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';

import {
  Card,
  Button,
  Title,
  Text,
  Group,
} from '@mantine/core';
import { notifyError } from '../../utils/notifications.js';

export const AccountActionsForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const deleteUser = async () => {
    try {
      const response = await apiClient.delete(`/api/v1/user`);

      if (response.status === 200) {
        navigate('/');
      }
    } catch (err) {
      console.error('Account deletion failed:', err);
      notifyError(t('user.accountActions.deleteError'));
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mt="lg">
      <Title order={3} mb="md">{t('user.accountActions.title')}</Title>
      <Text size="sm" c="dimmed" mb="md">
        {t('user.accountActions.description')}
      </Text>

      <Group justify="left" mt="md">
        <Button
          color="red"
          onClick={deleteUser}
        >
          {t('user.accountActions.delete')}
        </Button>
      </Group>
    </Card>
  );
};

export default AccountActionsForm;
