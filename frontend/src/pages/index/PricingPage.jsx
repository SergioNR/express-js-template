import { Container, Title, Text, Card, List, ThemeIcon, Stack, SimpleGrid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import RegisterButton from '../../components/navBarElements/RegisterButton.jsx';
import Seo from '../../components/Seo.jsx';
import { PLANS } from '../../config/plans.js';

export const PricingPage = () => {
  const { t } = useTranslation();
  const plansArray = Object.values(PLANS);

  return (
    <Container py="xl" size="lg">
      <Seo
        title={t('index.pricing.title')}
        description={t('index.pricing.subtitle')}
        path="/pricing"
      />
      <Stack align="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={2}>{t('index.pricing.title')}</Title>
          <Text c="dimmed" mt="xs" style={{ maxWidth: 640, marginInline: 'auto' }}>
            {t('index.pricing.subtitle')}
          </Text>
        </div>

        <div style={{ width: '100%', maxWidth: plansArray.length === 1 ? 420 : 'none', margin: '0 auto' }}>
          <SimpleGrid cols={{ base: 1, sm: plansArray.length }} spacing="xl" style={{ width: '100%' }}>
            {plansArray.map((plan) => (
              <Card
                key={plan.id}
                withBorder
                shadow="sm"
                radius="md"
                p="lg"
                style={{ width: '100%', height: '100%', textAlign: 'center' }}
              >
                <Title order={3} mb="md">{t(`index.pricing.plans.${plan.id}.name`)}</Title>

                <Text c="dimmed" size="sm" mb="md">
                  {t(`index.pricing.plans.${plan.id}.subtitle`)}
                </Text>

                <List spacing="sm" size="sm" mb="xl" style={{ textAlign: 'left', display: 'inline-block' }}>
                  {t(`index.pricing.plans.${plan.id}.features`, { returnObjects: true }).map((feature) => (
                    <List.Item
                      key={feature}
                      icon={
                        <ThemeIcon size={20} radius="xl" color="green">
                          ✓
                        </ThemeIcon>
                      }
                    >
                      {feature}
                    </List.Item>
                  ))}
                </List>

                <div>
                  <RegisterButton />
                </div>
              </Card>
            ))}
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  );
};

export default PricingPage;
