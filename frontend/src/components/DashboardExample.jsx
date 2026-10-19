import { Title, Text, AspectRatio, Stack, Box } from '@mantine/core';

const DashboardExample = () => {
  return (
    <Stack align="center" gap="xl">
      <Title order={2} ta="center" w="100%" maw="1140px">
        Una captura de tu producto
      </Title>
      <Text size="lg" ta="center" c="dimmed" w="100%" maw="1140px">
        Sustituye este panel por una imagen o un vídeo que muestre tu producto en funcionamiento
      </Text>

      <AspectRatio ratio={16 / 9} mt="md" w="100%" maw="1500px">
        <Box
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px dashed var(--mantine-color-default-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed">Captura del producto (placeholder)</Text>
        </Box>
      </AspectRatio>
    </Stack>
  );
};

export default DashboardExample;
