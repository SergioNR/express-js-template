import { useState } from 'react'
import apiClient from '../../config/API/axiosConfig.mjs'
import { Container, Stack, Card, Title, Text, Group, Button, Loader, Center, Badge, SimpleGrid, List, Alert } from '@mantine/core'
import { useSubscription } from '../../contexts/SubscriptionContext.jsx'
import NoActiveSubscriptionBanner from '../../components/partials/NoActiveSubscriptionBanner.jsx'

const UserBilling = () => {
  const { subscription, loading, error, hasActiveSubscription } = useSubscription()
  const [actionError, setActionError] = useState(null)


  const handlePriceLink = async (planName, planBillingCycle) => {

    const planData = {
      planName: planName,
      planBillingCycle: planBillingCycle,
    }

    try {
      setActionError(null)
      const response = await apiClient.post(`/api/v1/billing/checkout-session`, planData)
      const { checkoutSessionUrl } = response.data
      window.open(checkoutSessionUrl, '_blank')
    } catch (err) {
      if (err.status === 400) {
              return setActionError('El usuario ya tiene una suscripción existente')
            }
            return setActionError('Se ha producido un error generando el enlace de pago. Por favor, inténtalo más tarde');
          }
    }


  const handleBillingCustomerPortal = async () => {
    try {
      setActionError(null)
      const response = await apiClient.post(`/api/v1/billing/customer-portal`)
      const { customerPortalUrl } = response.data
      window.open(customerPortalUrl, '_blank')
    } catch (err) {
      setActionError('Se ha producido un error obteniendo el área de usuario. Por favor, inténtalo más tarde')
    }
  }

  if (loading) {
    return (
      <Center h={200}>
        <Stack gap="xs" align="center">
          <Loader />
                    <Text c="dimmed" size="sm">Cargando información de facturación...</Text>
        </Stack>
      </Center>
    )
  }

  const combinedError = actionError || error
  if (combinedError) {
    return (
      <Container size="sm">
        <Alert color="red" title="Error">{combinedError}</Alert>
      </Container>
    )
  }

  return (
    <Container size="sm">
      <Stack gap="lg">

                  <Card withBorder p="lg" radius="md">
            <Stack gap="sm" mt="sm">
              <Text fw={500}>
                <b>Estado de la suscripción:</b> {hasActiveSubscription ? 'Activa' : 'Inactiva'}
              </Text>
              {subscription.next_charge_at && (
                <Text fw={500}>
                  <b>Próxima fecha de cobro:</b> {new Date(subscription.next_charge_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
              {subscription.expires_at && (
                <Text fw={500}>
                  <b>Finaliza el:</b> {new Date(subscription.expires_at).toLocaleDateString('es-ES', {
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
                              <Title order={3}>Suscripción Mensual</Title>
                                          <Group align="center" mt="xs">
                                            <Text fw={700} size="xl">€29/mes</Text>
                                            <Text size="sm" c="dimmed">IVA incluido</Text>
                                          </Group>
                                          {/* hidden placeholder to keep cards identical in height distribution */}
                                                      <Text c="teal" size="sm" mt={4} style={{ visibility: 'hidden' }}>Ahorra 17%</Text>
                                                      <Text c="dimmed" mt="xs">Utiliza la plataforma sin límites.</Text>
                                                      <Button
                                mt="auto"
                                fullWidth
                                variant= 'outline'
                                disabled={hasActiveSubscription}
                                onClick={() => handlePriceLink('basic', 'monthly')}
                              >
                                { hasActiveSubscription ? 'Ya tienes una suscripción activa' : 'Elegir mensual' }
                              </Button>
                            </Card>
                          </SimpleGrid>
        }


        <Card withBorder p="lg" radius="md">
                  <Title order={3}>Historial de facturas</Title>
                  <Text c="dimmed" mt="xs">
                    Encuentra tus facturas y gestiona los métodos de pago y la suscripción.
                  </Text>
          <Group mt="md">
                      <Button onClick={handleBillingCustomerPortal}>Abrir portal del cliente</Button>
                    </Group>
        </Card>
      </Stack>
    </Container>
  )
}

export default UserBilling