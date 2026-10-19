import { Container, Title, Text, List, ListItem, Divider, Paper, Stack } from '@mantine/core';

const TerminosCondiciones = () => {
    return (
        <Container size="md" py="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack gap="lg">

                    <Title order={1}>Términos y Condiciones de Uso</Title>

                    <Title order={2}>1. Objeto</Title>
                    <Text>
                        Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma (en adelante, «la Plataforma»). Sustituye este texto por las condiciones legales de tu servicio.
                    </Text>
                    <Text>
                        Al registrarse y utilizar la Plataforma, el usuario acepta plenamente y sin reservas estos Términos y Condiciones.
                    </Text>

                    <Title order={2}>2. Registro y cuentas de usuario</Title>
                    <List withPadding>
                        <ListItem>Los usuarios deben crear una cuenta para poder acceder a la Plataforma.</ListItem>
                        <ListItem>Cada usuario es responsable de la veracidad de los datos proporcionados y de la seguridad de sus credenciales de acceso.</ListItem>
                    </List>

                    <Divider />

                    <Title order={2}>3. Privacidad y protección de datos</Title>
                    <List withPadding>
                        <ListItem>Los datos personales se recopilarán y procesarán de acuerdo con la normativa de protección de datos aplicable (como el Reglamento General de Protección de Datos – RGPD).</ListItem>
                        <ListItem>Los usuarios podrán ejercer sus derechos de acceso, rectificación, supresión y portabilidad mediante contacto con el administrador de la Plataforma.</ListItem>
                        <ListItem>La Plataforma aplica medidas de seguridad técnicas y organizativas para proteger la confidencialidad e integridad de los datos.</ListItem>
                    </List>

                    <Title order={2}>4. Política de cookies y tecnologías de seguimiento</Title>
                    <Text>
                        La Plataforma utiliza cookies y tecnologías similares para mejorar la experiencia de usuario, analizar la actividad y proteger la seguridad del servicio.
                    </Text>

                    <Title order={2}>5. Limitación de responsabilidad</Title>
                    <List withPadding>
                        <ListItem>La Plataforma podrá suspender o cancelar cuentas que hagan un uso indebido, ilegal o fraudulento del servicio.</ListItem>
                        <ListItem>El uso de la Plataforma se ofrece «tal cual», sin garantías de disponibilidad ininterrumpida ni de idoneidad para un propósito específico.</ListItem>
                    </List>

                    <Title order={2}>6. Niveles de servicio y soporte</Title>
                    <Text>
                        La Plataforma proporciona soporte técnico básico a través de correo electrónico (support@yourapp.com). Los tiempos de respuesta habituales son de hasta 72 horas laborables.
                    </Text>

                    <Title order={2}>7. Modificaciones</Title>
                    <Text>
                        La Plataforma se reserva el derecho a modificar en cualquier momento los presentes Términos y Condiciones. Las modificaciones entrarán en vigor desde su publicación en el sitio web.
                    </Text>

                    <Title order={2}>8. Legislación aplicable</Title>
                    <Text>
                        Estos Términos y Condiciones se rigen por la legislación vigente aplicable. Cualquier conflicto derivado de su interpretación o ejecución será resuelto ante los tribunales competentes.
                    </Text>

                </Stack>
            </Paper>
        </Container>
    );
};

export default TerminosCondiciones;
