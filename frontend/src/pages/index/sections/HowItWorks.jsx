import { Container, Title, SimpleGrid, Card, Stack, Text } from '@mantine/core';
import { IconUserPlus, IconSettings, IconRocket } from '@tabler/icons-react';

const HowItWorks = () => (
  <Container size="lg" py="xl" id="how-it-works">
    <Title order={2} ta="center" mb="xl">
      Cómo funciona
    </Title>

    <SimpleGrid cols={{ base: 1, sm: 1, md: 3 }} spacing="xl">
      <Card shadow="sm" radius="lg" withBorder p="lg">
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
          <IconUserPlus size={56} color="#238BE6" />
        </Card.Section>
        <Stack gap="xs" align="center" mt="md">
          <Text fw={700} fz="lg">1. Crea tu cuenta</Text>
          <Text c="dimmed" ta="center">
            Regístrate en menos de un minuto y empieza a explorar la plataforma sin compromiso.
          </Text>
        </Stack>
      </Card>

      <Card shadow="sm" radius="lg" withBorder p="lg">
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
          <IconSettings size={56} color="#238BE6" />
        </Card.Section>
        <Stack gap="xs" align="center" mt="md">
          <Text fw={700} fz="lg">2. Configura tu espacio de trabajo</Text>
          <Text c="dimmed" ta="center">
            Adapta la plataforma a las necesidades de tu proyecto y de tu equipo.
          </Text>
        </Stack>
      </Card>

      <Card shadow="sm" radius="lg" withBorder p="lg">
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
          <IconRocket size={56} color="#238BE6" />
        </Card.Section>
        <Stack gap="xs" align="center" mt="md">
          <Text fw={700} fz="lg">3. Empieza a obtener valor desde el primer día</Text>
          <Text c="dimmed" ta="center">
            Todo lo que necesitas para trabajar de forma sencilla, rápida y colaborativa.
          </Text>
        </Stack>
      </Card>
    </SimpleGrid>
  </Container>
);

export default HowItWorks;
