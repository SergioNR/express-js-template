import { Container, Title, SimpleGrid, Card, Text } from '@mantine/core';
import { IconBolt, IconDevices, IconUsers, IconPlug, IconShieldLock, IconCloudDownload } from '@tabler/icons-react';

const Features = () => (
  <Container size="lg" py="xl">
    <Title order={2} ta="center" mb="xl">
      Características
    </Title>
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconBolt size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Empieza en minutos
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Ponlo en marcha sin configuración compleja y sin necesidad de conocimientos técnicos
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconDevices size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Accede desde cualquier dispositivo
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Diseñado para funcionar igual de bien en escritorio, tablet y móvil
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconUsers size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Colabora con tu equipo
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Comparte información y trabaja de forma conjunta en un mismo espacio
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconPlug size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Integraciones con tus herramientas
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Conecta la plataforma con las herramientas que ya utilizas a diario
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconShieldLock size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Seguridad y privacidad
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Datos protegidos y tratados conforme a la normativa europea de protección de datos
        </Text>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section p="lg" bg="gray.0">
          <IconCloudDownload size={48} color="#238BE6" />
        </Card.Section>
        <Text fw={500} mt="md">
          Exporta tus datos
        </Text>
        <Text size="sm" c="dimmed" mt="sm">
          Descarga tu información cuando lo necesites y llévala a donde quieras
        </Text>
      </Card>
    </SimpleGrid>
  </Container>
);

export default Features;
