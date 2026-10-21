import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Center, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

//* Shown by the area wrappers when the session check fails for a reason other
//* than an expired session (network error, server error)
export const SessionCheckError = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <Center h={300} px="md">
      <Stack gap="md" align="center" maw={480}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
          {t('errors.sessionCheck')}
        </Alert>
        <Button variant="light" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </Stack>
    </Center>
  );
};

SessionCheckError.propTypes = {
  onRetry: PropTypes.func.isRequired,
};

export default SessionCheckError;
