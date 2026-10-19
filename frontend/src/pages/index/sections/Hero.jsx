import { Container, Stack, Title, Text, Group } from '@mantine/core';
import RegisterButton from '../../../components/navBarElements/RegisterButton';


const MainHero = () => (
  <Container size="lg" py="xl">
    <Stack align="center" gap="xl">
      <Title order={1} ta="center">
        Tu producto, listo para destacar
      </Title>
      <Text size="lg" ta="center" c="dimmed">
        Describe aquí tu propuesta de valor: qué problema resuelve tu producto y por qué tus clientes deberían probarlo.
      </Text>
      <Group>
        <RegisterButton />
      </Group>
    </Stack>
  </Container>
);

export default MainHero;
