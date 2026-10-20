import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconArrowUpRight,
  IconCalendarClock,
  IconCalendarUp,
  IconCircleCheck,
  IconCircleX,
  IconClockHour3,
  IconCreditCard,
  IconExternalLink,
  IconHistory,
  IconKey,
  IconReceipt2,
} from '@tabler/icons-react';
import apiClient from '../../config/API/axiosConfig.mjs';
import { useSubscription } from '../../contexts/SubscriptionContext.jsx';
import NoActiveSubscriptionBanner from '../../components/partials/NoActiveSubscriptionBanner.jsx';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatRelativeDays = (value) => {
  if (!value) return '—';
  const rtf = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  return rtf.format(
    Math.round((new Date(value).getTime() - Date.now()) / DAY_MS),
    'day'
  );
};

const StatCard = ({ icon, label, children }) => (
  <Card withBorder p="lg" radius="md">
    <Group justify="space-between" mb="xs">
      <Text c="dimmed" size="sm" fw={500}>
        {label}
      </Text>
      <ThemeIcon variant="light" size="lg" radius="md">
        {icon}
      </ThemeIcon>
    </Group>
    {children}
  </Card>
);

StatCard.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  children: PropTypes.node,
};

const QuickAction = ({ icon, title, description, action }) => (
  <Group justify="space-between" wrap="nowrap" py="xs">
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" size="lg" radius="md">
        {icon}
      </ThemeIcon>
      <Box>
        <Text fw={500} size="sm">
          {title}
        </Text>
        <Text c="dimmed" size="xs">
          {description}
        </Text>
      </Box>
    </Group>
    {action}
  </Group>
);

QuickAction.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { subscription, hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get('/api/v1/user');
        setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  const daysRemaining = useMemo(() => {
    if (!subscription?.expires_at) return null;
    return Math.max(
      0,
      Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / DAY_MS)
    );
  }, [subscription]);

  const periodProgress = useMemo(() => {
    const start = subscription?.created_at ? new Date(subscription.created_at).getTime() : null;
    const end = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : null;
    if (!start || !end || end <= start) return null;
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  }, [subscription]);

  const loading = userLoading || subscriptionLoading;

  return (
    <Stack gap="lg">
      <NoActiveSubscriptionBanner />

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Title order={2}>Panel de control</Title>
          <Text c="dimmed" mt={4}>
            {user?.email ? `Sesión iniciada como ${user.email}` : 'Tu área personal'} ·{' '}
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </Box>
        <Button
          variant="light"
          rightSection={<IconArrowUpRight size={16} />}
          onClick={() => navigate('/user/billing')}
          visibleFrom="xs"
        >
          Gestionar suscripción
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <StatCard label="Suscripción" icon={<IconCreditCard size={20} stroke={1.5} />}>
          {loading ? (
            <Skeleton height={28} width="60%" />
          ) : hasActiveSubscription ? (
            <Badge color="teal" variant="light" size="lg">
              Activa
            </Badge>
          ) : (
            <Badge color="red" variant="light" size="lg">
              Inactiva
            </Badge>
          )}
        </StatCard>

        <StatCard label="Días restantes" icon={<IconCalendarClock size={20} stroke={1.5} />}>
          {loading ? (
            <Skeleton height={28} width="40%" />
          ) : hasActiveSubscription && daysRemaining !== null ? (
            <Group gap={6} align="baseline">
              <Text fw={700} style={{ fontSize: '1.5rem' }}>
                {daysRemaining}
              </Text>
              <Text c="dimmed" size="sm">
                hasta el {formatDate(subscription.expires_at)}
              </Text>
            </Group>
          ) : (
            <Text c="dimmed" size="sm">
              Sin suscripción activa
            </Text>
          )}
        </StatCard>

        <StatCard label="Último acceso" icon={<IconHistory size={20} stroke={1.5} />}>
          {loading ? (
            <Skeleton height={28} width="70%" />
          ) : (
            <Text fw={500} size="sm">
              {formatDateTime(user?.last_login_at)}
            </Text>
          )}
        </StatCard>

        <StatCard label="Miembro desde" icon={<IconCalendarUp size={20} stroke={1.5} />}>
          {loading ? (
            <Skeleton height={28} width="70%" />
          ) : (
            <Text fw={500} size="sm">
              {formatDate(user?.created_at)}
            </Text>
          )}
        </StatCard>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder radius="md" p="lg">
          <Title order={4}>Estado de tu plan</Title>
          <Text c="dimmed" size="sm" mt={4} mb="lg">
            {hasActiveSubscription
              ? 'Tu suscripción está activa. Consulta el progreso del periodo actual.'
              : 'Activa un plan para desbloquear todas las funciones de la plataforma.'}
          </Text>

          {loading ? (
            <Skeleton height={120} radius="md" />
          ) : hasActiveSubscription ? (
            <Stack gap="md">
              {periodProgress !== null && (
                <Group justify="center">
                  <RingProgress
                    size={140}
                    thickness={12}
                    roundCaps
                    sections={[{ value: periodProgress, color: 'teal' }]}
                    label={
                      <Text ta="center" fw={700} size="sm">
                        {Math.round(periodProgress)}%
                      </Text>
                    }
                  />
                </Group>
              )}
              <Divider />
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Inicio del periodo
                </Text>
                <Text size="sm" fw={500}>
                  {formatDate(subscription.created_at)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Renovación / fin del periodo
                </Text>
                <Text size="sm" fw={500}>
                  {formatDate(subscription.expires_at)} ({formatRelativeDays(subscription.expires_at)})
                </Text>
              </Group>
            </Stack>
          ) : (
            <Stack gap="md" align="center" py="xl">
              <ThemeIcon size={48} radius="xl" variant="light" color="red">
                <IconCircleX size={26} stroke={1.5} />
              </ThemeIcon>
              <Text c="dimmed" size="sm" ta="center" maw={320}>
                No tienes ninguna suscripción activa en este momento.
              </Text>
              <Button onClick={() => navigate('/user/billing')} leftSection={<IconReceipt2 size={16} />}>
                Ver planes disponibles
              </Button>
            </Stack>
          )}
        </Card>

        <Stack gap="lg">
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Accesos rápidos</Title>
            <Divider my="md" />
            <QuickAction
              icon={<IconReceipt2 size={20} stroke={1.5} />}
              title="Planes y facturación"
              description="Gestiona tu suscripción, pagos y facturas"
              action={
                <Anchor size="sm" onClick={() => navigate('/user/billing')}>
                  <IconExternalLink size={16} />
                </Anchor>
              }
            />
            <QuickAction
              icon={<IconKey size={20} stroke={1.5} />}
              title="Seguridad de la cuenta"
              description="Actualiza tu contraseña y revisa el acceso"
              action={
                <Anchor size="sm" onClick={() => navigate('/user/profile')}>
                  <IconExternalLink size={16} />
                </Anchor>
              }
            />
            <QuickAction
              icon={<IconClockHour3 size={20} stroke={1.5} />}
              title="Renovación automática"
              description={
                hasActiveSubscription
                  ? `Se renovará ${formatRelativeDays(subscription.expires_at)}`
                  : 'Disponible al activar un plan'
              }
              action={
                <Badge size="sm" variant="light" color={hasActiveSubscription ? 'teal' : 'gray'}>
                  {hasActiveSubscription ? 'Activada' : 'Inactiva'}
                </Badge>
              }
            />
          </Card>

          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>Actividad reciente</Title>
              <ThemeIcon variant="light" size="sm" radius="sm">
                <IconActivity size={16} stroke={1.5} />
              </ThemeIcon>
            </Group>
            <Timeline
              bulletSize={20}
              lineWidth={2}
              active={2}
            >
              <Timeline.Item
                bullet={<IconCalendarUp size={12} stroke={1.5} />}
                title="Cuenta creada"
              >
                <Text c="dimmed" size="xs">
                  {formatDate(user?.created_at)}
                </Text>
              </Timeline.Item>
              <Timeline.Item
                bullet={<IconHistory size={12} stroke={1.5} />}
                title="Último inicio de sesión"
              >
                <Text c="dimmed" size="xs">
                  {formatDateTime(user?.last_login_at)}
                </Text>
              </Timeline.Item>
              <Timeline.Item
                bullet={<IconCircleCheck size={12} stroke={1.5} />}
                color={hasActiveSubscription ? 'teal' : 'gray'}
                title={hasActiveSubscription ? 'Suscripción activa' : 'Sin suscripción'}
              >
                <Text c="dimmed" size="xs">
                  {hasActiveSubscription
                    ? `Vence el ${formatDate(subscription.expires_at)}`
                    : 'Activa un plan cuando quieras'}
                </Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Stack>
      </SimpleGrid>

      {!loading && !hasActiveSubscription && (
        <Alert color="gray" variant="light" icon={<IconCreditCard size={16} />}>
          Necesitas una suscripción activa para utilizar la plataforma.{' '}
          <Anchor onClick={() => navigate('/user/billing')}>Elige tu plan aquí</Anchor>.
        </Alert>
      )}
    </Stack>
  );
};

export default UserDashboard;
