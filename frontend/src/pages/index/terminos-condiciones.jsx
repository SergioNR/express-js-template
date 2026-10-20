import { Fragment } from 'react';
import { Container, Title, Text, List, Divider, Paper, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo.jsx';

const SECTIONS = [
  { key: 'object', type: 'text' },
  { key: 'registration', type: 'list' },
  { key: 'privacy', type: 'list', dividerBefore: true },
  { key: 'cookies', type: 'text' },
  { key: 'liability', type: 'list' },
  { key: 'support', type: 'text' },
  { key: 'changes', type: 'text' },
  { key: 'law', type: 'text' },
];

const TerminosCondiciones = () => {
  const { t } = useTranslation();

  return (
    <Container size="md" py="xl">
      <Seo
        title={t('index.terms.title')}
        description={t('seo.termsDescription')}
        path="/terminos-condiciones"
      />
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack gap="lg">

          <Title order={1}>{t('index.terms.title')}</Title>

          {SECTIONS.map(({ key, type, dividerBefore }) => (
            <Fragment key={key}>
              {dividerBefore && <Divider />}
              <Title order={2}>{t(`index.terms.sections.${key}.title`)}</Title>
              {type === 'text' ? (
                t(`index.terms.sections.${key}.paragraphs`, { returnObjects: true }).map((paragraph) => (
                  <Text key={paragraph}>{paragraph}</Text>
                ))
              ) : (
                <List withPadding>
                  {t(`index.terms.sections.${key}.items`, { returnObjects: true }).map((item) => (
                    <List.Item key={item}>{item}</List.Item>
                  ))}
                </List>
              )}
            </Fragment>
          ))}

        </Stack>
      </Paper>
    </Container>
  );
};

export default TerminosCondiciones;
