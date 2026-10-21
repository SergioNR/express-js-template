import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { Container, Stack, Card, Title, Text, Group, Button, SimpleGrid, Alert, Tooltip } from '@mantine/core';
import { useSubscription } from '../../contexts/useSubscription.js';
import PageLoader from '../../components/PageLoader.jsx';
import Seo from '../../components/Seo.jsx';
import { notifyError } from '../../utils/notifications.js';
import { PLANS } from '../../config/plans.js';

const CHECKOUT_URL_PREFIX = 'https://checkout.stripe.com/';
const PORTAL_URL_PREFIX = 'https://billing.stripe.com/';
const BILLING_PERMISSION = 'billing.manage';

//* Only navigate to Stripe-hosted pages - never to an arbitrary URL from the API
const redirectToStripe = (url, expectedPrefix) => {
  if (typeof url !== 'string' || !url.startsWith(expectedPrefix)) {
    return false;
  }

  window.location.assign(url);
  return true;
};

const UserBilling = () => {
  const { t } = useTranslation();
  const { subscription, loading, error, hasActiveSubscription, hasBillingId } = useSubscription();
  // null while unknown - the backend still enforces the permission (403)
  const [canManageBilling, setCanManageBilling] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadPermissions = async () => {
      try {
        const response = await apiClient.get('/api/v1/team', { signal: controller.signal });
        const permissions = response.data?.callerPermissions ?? [];

        setCanManageBilling(permissions.includes(BILLING_PERMISSION));
      } catch {
        // Leave the actions enabled - a 403 on click is handled with a toast
      }
    };

    loadPermissions();

    return () => controller.abort();
  }, []);

  const billingLocked = canManageBilling === false;

  const handlePriceLink = async (planName, planBillingCycle) => {
    const planData = {
      planName: planName,
      planBillingCycle: planBillingCycle,
    };

    setRedirecting(true);

    try {
      const response = await apiClient.post('/api/v1/billing/checkout-session', planData);

      if (redirectToStripe(response.data?.checkoutSessionUrl, CHECKOUT_URL_PREFIX)) {
        return;
      }

      notifyError(t('billing.errors.checkout'));
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 403) {
        notifyError(t('billing.errors.forbidden'));
      } else if (status === 409 && code === 'SUBSCRIPTION_ACTIVE') {
        notifyError(t('billing.errors.subscriptionActive'));
      } else if (status === 400 || status === 409 || status === 422) {
        notifyError(t('billing.errors.invalid'));
      } else {
        notifyError(t('billing.errors.checkout'));
      }
    }

    setRedirecting(false);
  };

  const handleBillingCustomerPortal = async () => {
    setRedirecting(true);

    try {
      const response = await apiClient.post('/api/v1/billing/customer-portal');

      if (redirectToStripe(response.data?.customerPortalUrl, PORTAL_URL_PREFIX)) {
        return;
      }

      notifyError(t('billing.errors.portal'));
    } catch (err) {
      if (err?.response?.status === 403) {
        notifyError(t('billing.errors.forbidden'));
      } else {
        notifyError(t('billing.errors.portal'));
      }
    }

    setRedirecting(false);
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
              {/* Disabled buttons swallow pointer events - the span wrapper keeps the tooltip hoverable */}
              <Tooltip
                label={t('billing.locked.manage')}
                disabled={!billingLocked}
                position="top"
                withArrow
              >
                <span style={{ marginTop: 'auto' }}>
                  <Button
                    mt="md"
                    fullWidth
                    variant='outline'
                    disabled={hasActiveSubscription || billingLocked}
                    loading={redirecting}
                    onClick={() => handlePriceLink(PLANS.PRO.id, 'monthly')}
                  >
                    { hasActiveSubscription ? t('billing.monthly.alreadySubscribed') : t('billing.monthly.choose') }
                  </Button>
                </span>
              </Tooltip>
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
              label={billingLocked ? t('billing.locked.manage') : t('billing.invoices.portalDisabled')}
              disabled={hasBillingId && !billingLocked}
              position="top"
              withArrow
            >
              <span>
                <Button
                  onClick={handleBillingCustomerPortal}
                  disabled={!hasBillingId || billingLocked}
                  loading={redirecting}
                >
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
