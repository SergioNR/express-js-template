import { Alert, Button, Group, Text } from '@mantine/core';
import { useSubscription } from '../../contexts/SubscriptionContext.jsx';
import { useNavigate } from 'react-router';

const NoActiveSubscriptionBanner = () => {
  const { hasActiveSubscription, loading, error } = useSubscription();
  const navigate = useNavigate();

  if (loading || error || hasActiveSubscription) {
    return null;
  }

  return (
    <Alert color="gray" variant="light" title="Suscripción inactiva" mb="lg">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text>No tienes una suscripción activa. Activa un plan para continuar usando la plataforma.</Text>
        <Button size="xs" variant="filled" onClick={() => navigate('/user/billing')}>
          Elegir plan
        </Button>
      </Group>
    </Alert>
  );
};

export default NoActiveSubscriptionBanner;