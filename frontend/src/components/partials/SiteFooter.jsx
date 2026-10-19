import { Box, Container, SimpleGrid, Stack, Group, Divider, Image, Text, Anchor } from '@mantine/core';
import classes from './SiteFooter.module.css';

export const SiteFooter = () => {

  const year = new Date().getFullYear();

  const columns = [
    {
      title: 'Producto',
      links: [
        { label: 'Precio', href: '/pricing' },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
      ],
    },

    {
      title: 'Legal',
      links: [
        { label: 'Términos y condiciones', href: '/terminos-condiciones' },
        { label: 'Contacto', href: 'mailto:hello@yourapp.com' },

      ],
    },
  ];

  return (
    <Box component="footer" role="contentinfo" aria-label="Site footer" p="xl" className={classes.footer}>
      <Container size="xl">
        <SimpleGrid
          cols={5}
          spacing="xl"
          breakpoints={[
            { maxWidth: 'lg', cols: 4, spacing: 'xl' },
            { maxWidth: 'md', cols: 3, spacing: 'lg' },
            { maxWidth: 'sm', cols: 1, spacing: 'md' },
          ]}
        >
          <Stack gap="xs">
            <Group gap="sm" align="center" wrap="nowrap">
              <Image src="/logo.svg" alt="Company logo" w={36} h={36} />
              <Text fw={700} fz="lg">
                Your App
              </Text>
            </Group>
            <Text c="dimmed" fz="sm">
              Una descripción corta de tu producto: qué hace, para quién es y por qué merece la pena probarlo.
            </Text>
          </Stack>

          {columns.map((col) => (
            <Stack key={col.title} gap={6}>
              <Text fw={700} fz="sm">
                {col.title}
              </Text>
              {col.links.map((link) => (
                <Anchor
                  key={link.label}
                  href={link.href}
                  c="dimmed"
                  size="sm"
                  underline="hover"
                >
                  {link.label}
                </Anchor>
              ))}
            </Stack>
          ))}
        </SimpleGrid>

        <Divider my="lg" />

        <Group justify="space-between" wrap="wrap" gap="md">
          <Text c="dimmed" fz="sm">
            © {year} Your App. Todos los derechos reservados.
          </Text>


        </Group>
      </Container>
    </Box>
  );
}
