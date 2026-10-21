import { useTranslation } from 'react-i18next';
import { Box } from '@mantine/core';
import PasswordUpdateForm from '../../components/auth/PasswordUpdateForm';
import Seo from '../../components/Seo.jsx';
import { AccountActionsForm } from './AccountActionsForm';

const CustomerProfile = () => {
  const { t } = useTranslation();

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Seo title={t('seo.pages.profile')} />
      <PasswordUpdateForm />
      <AccountActionsForm />
    </Box>
  );
};

export default CustomerProfile;
