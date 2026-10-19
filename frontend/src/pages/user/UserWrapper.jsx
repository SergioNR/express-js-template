import { Outlet } from "react-router";
import  NavbarSimple  from "../../components/partials/UserNavBar";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import apiClient from "../../config/API/axiosConfig.mjs";
import { usePostHog } from 'posthog-js/react'
import { AppShell, Burger } from '@mantine/core';
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

            } catch (error) {
                navigate('/auth/login');
            }
        };

        checkSession();
    }, [navigate]);


    useEffect( () => {

      if (userId) {
        posthog?.identify(userId, {
        })
      }
    }, [userId])


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
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
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




