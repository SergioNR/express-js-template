import { Container, Title, Text, Card, List, ThemeIcon, Stack, SimpleGrid } from '@mantine/core';
import RegisterButton from '../../components/navBarElements/RegisterButton.jsx';
import { PLANS } from '../../config/plans.js';

export const PricingPage = () => {
  const plansArray = Object.values(PLANS);

  return (
    <Container py="xl" size="lg">
      <Stack align="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={2}>Planes y precios</Title>
          <Text c="dimmed" mt="xs" style={{ maxWidth: 640, marginInline: 'auto' }}>
            Un único plan simple para empezar hoy mismo. Sin complicaciones, cancela cuando quieras.
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
                <Title order={3} mb="md">{plan.name}</Title>

                <Text c="dimmed" size="sm" mb="md">
                  {plan.subtitle}
                </Text>

                <List spacing="sm" size="sm" mb="xl" style={{ textAlign: 'left', display: 'inline-block' }}>
                  {plan.features.map((feature, index) => (
                    <List.Item
                      key={index}
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
