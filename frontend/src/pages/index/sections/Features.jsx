import { Container, Title, SimpleGrid, Card, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconBolt,
  IconCloudDownload,
  IconDevices,
  IconPlug,
  IconShieldLock,
  IconUsers,
} from '@tabler/icons-react';

const FEATURES = [
  { key: 'quickStart', icon: IconBolt },
  { key: 'multiDevice', icon: IconDevices },
  { key: 'collaboration', icon: IconUsers },
  { key: 'integrations', icon: IconPlug },
  { key: 'security', icon: IconShieldLock },
  { key: 'export', icon: IconCloudDownload },
];

const Features = () => {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl">
      <Title order={2} ta="center" mb="xl">
        {t('index.features.title')}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="lg">
        {FEATURES.map(({ key, icon: Icon }) => (
          <Card key={key} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section p="lg" bg="gray.0">
              <Icon size={48} color="#238BE6" />
            </Card.Section>
            <Text fw={500} mt="md">
              {t(`index.features.items.${key}.title`)}
            </Text>
            <Text size="sm" c="dimmed" mt="sm">
              {t(`index.features.items.${key}.description`)}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default Features;
