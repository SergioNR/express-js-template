import { Container, Stack, Title, Text, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import RegisterButton from '../../../components/navBarElements/RegisterButton';

const MainHero = () => {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl">
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">
          {t('index.hero.title')}
        </Title>
        <Text size="lg" ta="center" c="dimmed">
          {t('index.hero.subtitle')}
        </Text>
        <Group>
          <RegisterButton />
        </Group>
      </Stack>
    </Container>
  );
};

export default MainHero;
