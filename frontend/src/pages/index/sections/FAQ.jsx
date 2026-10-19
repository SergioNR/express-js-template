import { Container, Title, Accordion, Anchor } from '@mantine/core';
import { IconHelpHexagon } from '@tabler/icons-react';

const FAQ = () => (
  <Container size="lg" py="xl">
    <Title order={2} ta="center" mb="xl">
      Preguntas frecuentes
    </Title>
    <Accordion variant="separated">

      <Accordion.Item value="signup">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          ¿Cómo me doy de alta?
        </Accordion.Control>
        <Accordion.Panel>
          Crea una cuenta desde el botón de registro en menos de un minuto. Solo necesitas un correo electrónico y una contraseña.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="pricing">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          ¿Cuánto cuesta?
        </Accordion.Control>
        <Accordion.Panel>
          Puedes consultar todos los detalles de nuestro plan en la página de <Anchor href="/pricing">precios</Anchor>.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="cancel">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          ¿Puedo cancelar mi suscripción en cualquier momento?
        </Accordion.Control>
        <Accordion.Panel>
          Sí. Puedes gestionar o cancelar tu suscripción en cualquier momento desde el portal de facturación de tu área de usuario.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="installation">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          ¿Necesito instalar algo?
        </Accordion.Control>
        <Accordion.Panel>
          No. La plataforma funciona directamente desde tu navegador, sin instalaciones ni descargas.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="security">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          ¿Mis datos están seguros?
        </Accordion.Control>
        <Accordion.Panel>
          Sí. Aplicamos medidas de seguridad técnicas y organizativas y tratamos los datos conforme a la normativa europea de protección de datos.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="more-questions">
        <Accordion.Control icon={<IconHelpHexagon size={16} />}>
          Tengo más preguntas, ¿cómo puedo contactaros?
        </Accordion.Control>
        <Accordion.Panel>
          Escríbenos a <Anchor href="mailto:hello@yourapp.com">hello@yourapp.com</Anchor> y estaremos encantados de ayudarte.
        </Accordion.Panel>
      </Accordion.Item>

    </Accordion>
  </Container>
);

export default FAQ;
