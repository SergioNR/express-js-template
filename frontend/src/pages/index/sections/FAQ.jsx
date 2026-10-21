import { Container, Title, Accordion, Anchor } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { IconHelpHexagon } from '@tabler/icons-react';

const control = (t, key) => (
  <Accordion.Control icon={<IconHelpHexagon size={16} />}>
    {t(`index.faq.items.${key}.q`)}
  </Accordion.Control>
);

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl">
      <Title order={2} ta="center" mb="xl">
        {t('index.faq.title')}
      </Title>
      <Accordion variant="separated">

        <Accordion.Item value="signup">
          {control(t, 'signup')}
          <Accordion.Panel>
            {t('index.faq.items.signup.a')}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="pricing">
          {control(t, 'pricing')}
          <Accordion.Panel>
            <Trans
              i18nKey="index.faq.items.pricing.a"
              t={t}
              components={[<Anchor key="pricing" component={Link} to="/pricing" />]}
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="cancel">
          {control(t, 'cancel')}
          <Accordion.Panel>
            {t('index.faq.items.cancel.a')}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="installation">
          {control(t, 'installation')}
          <Accordion.Panel>
            {t('index.faq.items.installation.a')}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="security">
          {control(t, 'security')}
          <Accordion.Panel>
            {t('index.faq.items.security.a')}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="more-questions">
          {control(t, 'moreQuestions')}
          <Accordion.Panel>
            <Trans
              i18nKey="index.faq.items.moreQuestions.a"
              t={t}
              components={[<Anchor key="contact" href="mailto:hello@yourapp.com" />]}
            />
          </Accordion.Panel>
        </Accordion.Item>

      </Accordion>
    </Container>
  );
};

export default FAQ;
