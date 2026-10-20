import { Outlet, Link } from "react-router";
import NavbarSimple from "../../components/partials/UserNavBar";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import apiClient from "../../config/API/axiosConfig.mjs";
import { usePostHog } from 'posthog-js/react'
import { AppShell, Anchor, Burger, Group, Image, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SubscriptionProvider } from "../../contexts/SubscriptionContext.jsx";


const UserWrapper = () => {

    const posthog = usePostHog()
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [opened, { toggle }] = useDisclosure();
    const [userId, setUserId] = useState(null);


    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await apiClient.get(`/api/v1/auth/session`);
                setUserId(response.data.user.id)
                setLoading(false);

            } catch {
                navigate('/auth/login');
            }
        };

        checkSession();
    }, [navigate]);


    useEffect(() => {

      if (userId) {
        posthog?.identify(userId, {
        })
      }
    }, [userId, posthog])


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
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Anchor component={Link} to="/dashboard" underline="never" inherit>
                <Group gap="xs" wrap="nowrap">
                  <Image src="/logo.svg" alt="logo" h={28} w={28} />
                  <Text fw={600} size="lg" component="span">Panel de control</Text>
                </Group>
              </Anchor>
            </Group>

            <Group gap="lg" wrap="nowrap" visibleFrom="xs">
              <Anchor component={Link} to="/" size="sm" c="dimmed">
                Volver al sitio
              </Anchor>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <NavbarSimple />
        </AppShell.Navbar>

        <AppShell.Main>
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <>
              <Outlet />
            </>
          )}
        </AppShell.Main>
      </AppShell>
    </SubscriptionProvider>
  );

}

export default UserWrapper;
