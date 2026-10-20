import { Container, Title, SimpleGrid, Card, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconUserPlus, IconSettings, IconRocket } from '@tabler/icons-react';

const STEPS = [
  { key: 'create', icon: IconUserPlus },
  { key: 'configure', icon: IconSettings },
  { key: 'start', icon: IconRocket },
];

const HowItWorks = () => {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl" id="how-it-works">
      <Title order={2} ta="center" mb="xl">
        {t('index.howItWorks.title')}
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 1, md: 3 }} spacing="xl">
        {STEPS.map(({ key, icon: Icon }) => (
          <Card key={key} shadow="sm" radius="lg" withBorder p="lg">
            <Card.Section
              p="xl"
              bg="gray.0"
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
              }}
            >
              <Icon size={56} color="#238BE6" />
            </Card.Section>
            <Stack gap="xs" align="center" mt="md">
              <Text fw={700} fz="lg">{t(`index.howItWorks.steps.${key}.title`)}</Text>
              <Text c="dimmed" ta="center">
                {t(`index.howItWorks.steps.${key}.description`)}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default HowItWorks;
