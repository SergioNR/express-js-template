import { Center, Loader, Stack, Text } from '@mantine/core';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export const PageLoader = ({ label }) => {
  const { t } = useTranslation();

  return (
    <Center h={300}>
      <Stack gap="xs" align="center">
        <Loader />
        <Text c="dimmed" size="sm">{label ?? t('loading.default')}</Text>
      </Stack>
    </Center>
  );
};

PageLoader.propTypes = {
  label: PropTypes.string,
};

export default PageLoader;
