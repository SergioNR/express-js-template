import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import apiClient from '../../config/API/axiosConfig.mjs';
import { Card, Button, TextInput, Text, Alert, Box } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifySuccess } from '../../utils/notifications.js';

const PasswordUpdateForm = () => {
  const { t } = useTranslation();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const passwordUpdateData = {
      currentPassword: e.target.currentPassword.value,
      newPassword: e.target.newPassword.value,
    };

    try {
      await apiClient.patch('/api/v1/auth/update-user-password', passwordUpdateData);
      notifySuccess(t('auth.passwordUpdate.success'));
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setResponse({
          success: false,
          message: error.response.data.message,
        });
      } else if (error.response && error.response.status === 400) {
        const errorMessage = error.response.data.message;

        // Check if message is an array of validation objects
        if (Array.isArray(errorMessage)) {
          setResponse({
            success: false,
            message: errorMessage.map((err) => err.msg),
          });
        } else {
          setResponse({
            success: false,
            message: errorMessage,
          });
        }
      } else {
        // Handle other errors (network errors, server errors, etc)
        setResponse({
          success: false,
          message: t('auth.passwordUpdate.errors.unexpected'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mt="lg">
      <Text size="lg" fw={600} mb="md">{t('auth.passwordUpdate.title')}</Text>

      {response && response.success === false && (
        <Box mb="md">
          <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red">
            {Array.isArray(response.message) ? (
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {response.message.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            ) : (
              <Text>{response.message}</Text>
            )}
          </Alert>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <TextInput
          label={t('auth.passwordUpdate.username')}
          name="username"
          type="text"
          autoComplete='username'
          placeholder={t('auth.passwordUpdate.usernamePlaceholder')}
          mb="md"
          style={{ display: 'none' }}
        />

        <TextInput
          label={t('auth.passwordUpdate.currentPassword')}
          name="currentPassword"
          type="password"
          autoComplete='current-password'
          placeholder={t('auth.passwordUpdate.currentPasswordPlaceholder')}
          required
          mb="md"
        />

        <TextInput
          label={t('auth.passwordUpdate.newPassword')}
          name="newPassword"
          type="password"
          autoComplete='new-password'
          placeholder={t('auth.passwordUpdate.newPasswordPlaceholder')}
          required
          mb="md"
        />

        <Button
          type="submit"
          loading={loading}
          fullWidth
        >
          {t('auth.passwordUpdate.submit')}
        </Button>
      </form>
    </Card>
  );
};

export default PasswordUpdateForm;
