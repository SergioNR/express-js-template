import { Outlet, Link } from 'react-router';
import UserNavBar from '../../components/partials/UserNavBar';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { usePostHog } from 'posthog-js/react';
import { AppShell, Anchor, Burger, Group, Image, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import PageLoader from '../../components/PageLoader.jsx';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext.jsx';

const UserWrapper = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [opened, { toggle, close }] = useDisclosure();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/session');

        if (!cancelled) {
          setUserId(response.data.user.id);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          navigate('/auth/login', { replace: true });
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      posthog?.identify(userId, {});
    }
  }, [userId, posthog]);

  //* Nothing (including SubscriptionProvider's billing fetch) mounts until the
  //* session check passes
  if (loading) {
    return <PageLoader />;
  }

  return (
    <SubscriptionProvider>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                aria-label={t('nav.user.menu')}
              />
              <Anchor component={Link} to="/dashboard" underline="never" inherit>
                <Group gap="xs" wrap="nowrap">
                  <Image src="/logo.svg" alt={t('common.logoAlt')} h={28} w={28} />
                  <Text fw={600} size="lg" component="span">{t('user.panelTitle')}</Text>
                </Group>
              </Anchor>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <UserNavBar onNavigate={close} />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </SubscriptionProvider>
  );
};

export default UserWrapper;
