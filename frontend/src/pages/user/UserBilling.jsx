import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { Container, Stack, Card, Title, Text, Group, Button, SimpleGrid, Alert, Tooltip } from '@mantine/core';
import { useSubscription } from '../../contexts/SubscriptionContext.jsx';
import PageLoader from '../../components/PageLoader.jsx';
import Seo from '../../components/Seo.jsx';
import { notifyError } from '../../utils/notifications.js';

const UserBilling = () => {
  const { t } = useTranslation();
  const { subscription, loading, error, hasActiveSubscription, hasBillingId } = useSubscription();

  const handlePriceLink = async (planName, planBillingCycle) => {
    const planData = {
      planName: planName,
      planBillingCycle: planBillingCycle,
    };

    try {
      const response = await apiClient.post(`/api/v1/billing/checkout-session`, planData);
      const { checkoutSessionUrl } = response.data;
      window.open(checkoutSessionUrl, '_blank');
    } catch (err) {
      if (err.status === 400) {
        return notifyError(t('billing.errors.existingSubscription'));
      }
      if (err.status === 409 || err.status === 422) {
        return notifyError(t('billing.errors.invalid'));
      }
      return notifyError(t('billing.errors.checkout'));
    }
  };

  const handleBillingCustomerPortal = async () => {
    try {
      const response = await apiClient.post(`/api/v1/billing/customer-portal`);
      const { customerPortalUrl } = response.data;
      window.open(customerPortalUrl, '_blank');
    } catch {
      notifyError(t('billing.errors.portal'));
    }
  };

  if (loading) {
    return (
      <Container size="sm">
        <Seo title={t('seo.pages.billing')} />
        <PageLoader label={t('loading.billing')} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="sm">
        <Seo title={t('seo.pages.billing')} />
        <Alert color="red" title={t('common.error')}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container size="sm">
      <Seo title={t('seo.pages.billing')} />
      <Stack gap="lg">

        <Card withBorder p="lg" radius="md">
          <Stack gap="sm" mt="sm">
            <Text fw={500}>
              <b>{t('billing.status')}</b> {hasActiveSubscription ? t('billing.statusActive') : t('billing.statusInactive')}
            </Text>
            {subscription.expires_at && (
              <Text fw={500}>
                <b>{t('billing.expiresAt')}</b> {new Date(subscription.expires_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </Stack>
        </Card>

        { !hasActiveSubscription &&
          <SimpleGrid cols={1} spacing="lg">
            <Card
              withBorder
              p="lg"
              radius="md"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 280 }}
            >
              <Title order={3}>{t('billing.monthly.title')}</Title>
              <Group align="center" mt="xs">
                <Text fw={700} size="xl">{t('billing.monthly.price')}</Text>
                <Text size="sm" c="dimmed">{t('billing.monthly.vatIncluded')}</Text>
              </Group>
              {/* hidden placeholder to keep cards identical in height distribution */}
              <Text c="teal" size="sm" mt={4} style={{ visibility: 'hidden' }}>{t('billing.monthly.saveHint')}</Text>
              <Text c="dimmed" mt="xs">{t('billing.monthly.description')}</Text>
              <Button
                mt="auto"
                fullWidth
                variant='outline'
                disabled={hasActiveSubscription}
                onClick={() => handlePriceLink('basic', 'monthly')}
              >
                { hasActiveSubscription ? t('billing.monthly.alreadySubscribed') : t('billing.monthly.choose') }
              </Button>
            </Card>
          </SimpleGrid>
        }

        <Card withBorder p="lg" radius="md">
          <Title order={3}>{t('billing.invoices.title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('billing.invoices.description')}
          </Text>
          <Group mt="md">
            {/* Disabled buttons swallow pointer events - the span wrapper keeps the tooltip hoverable */}
            <Tooltip
              label={t('billing.invoices.portalDisabled')}
              disabled={hasBillingId}
              position="top"
              withArrow
            >
              <span>
                <Button onClick={handleBillingCustomerPortal} disabled={!hasBillingId}>
                  {t('billing.invoices.openPortal')}
                </Button>
              </span>
            </Tooltip>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
};

export default UserBilling;
