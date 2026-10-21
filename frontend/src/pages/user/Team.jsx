import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconMailForward,
  IconTrash,
  IconUserPlus,
} from '@tabler/icons-react';
import apiClient from '../../config/API/axiosConfig.mjs';
import Seo from '../../components/Seo.jsx';
import { notifyError, notifySuccess } from '../../utils/notifications.js';
import { formatDateTime } from '../../utils/formatDate.js';

const roleLabel = (t, roleName) => t(`team.roles.${roleName}`, roleName);

function LockedTooltip({ locked, label, children }) {
  if (!locked) {
    return children;
  }

  return (
    <Tooltip label={label}>
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  );
}

LockedTooltip.propTypes = {
  locked: PropTypes.bool,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export function Team() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [callerPermissions, setCallerPermissions] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const [inviteModalOpened, setInviteModalOpened] = useState(false);
  const [inviteRole, setInviteRole] = useState(null);
  const [inviteRoleError, setInviteRoleError] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await apiClient.get('/api/v1/team');

      setMembers(response.data.members);
      setInvites(response.data.invites);
      setCallerPermissions(response.data.callerPermissions);
      setAssignableRoles(response.data.assignableRoles);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const canInvite = callerPermissions.includes('team.invite');
  const canRemove = callerPermissions.includes('team.remove');
  const canManageRoles = callerPermissions.includes('team.manage_roles');

  const assignableRoleOptions = assignableRoles.map((roleName) => ({
    value: roleName,
    label: roleLabel(t, roleName),
  }));

  const submitInvite = async (event) => {
    event.preventDefault();

    //* Mantine's Select `required` is not enforced by the browser
    if (!inviteRole) {
      setInviteRoleError(true);
      return;
    }

    setInviting(true);

    try {
      await apiClient.post('/api/v1/team/invites', {
        email: event.target.email.value,
        roleName: inviteRole,
      });

      notifySuccess(t('team.invites.sentToast'));
      setInviteModalOpened(false);
      setInviteRole(null);
      event.target.email.value = '';
      await loadTeam();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        notifyError(t('team.errors.inviteConflict'));
      } else if (status === 403) {
        notifyError(t('team.errors.forbidden'));
      } else {
        notifyError(t('team.errors.generic'));
      }
    } finally {
      setInviting(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) {
      return;
    }

    setRemoving(true);

    try {
      await apiClient.delete(`/api/v1/team/members/${removeTarget.id}`);

      notifySuccess(t('team.members.removedToast', { email: removeTarget.email }));
      setRemoveTarget(null);
      await loadTeam();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        notifyError(t('team.errors.removeConflict'));
      } else {
        notifyError(t('team.errors.generic'));
      }
    } finally {
      setRemoving(false);
    }
  };

  const changeMemberRole = async (memberId, roleName) => {
    if (!roleName) {
      return;
    }

    try {
      await apiClient.patch(`/api/v1/team/members/${memberId}`, { roleName });

      notifySuccess(t('team.members.roleUpdatedToast'));
      await loadTeam();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        notifyError(t('team.errors.roleConflict'));
      } else if (status === 403) {
        notifyError(t('team.errors.forbidden'));
      } else {
        notifyError(t('team.errors.generic'));
      }
    }
  };

  const resendInvite = async (inviteId) => {
    try {
      await apiClient.post(`/api/v1/team/invites/${inviteId}/resend`);

      notifySuccess(t('team.invites.resentToast'));
      await loadTeam();
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        notifyError(t('team.errors.inviteConflict'));
      } else {
        notifyError(t('team.errors.generic'));
      }
    }
  };

  const revokeInvite = async (inviteId) => {
    try {
      await apiClient.delete(`/api/v1/team/invites/${inviteId}`);

      notifySuccess(t('team.invites.revokedToast'));
      await loadTeam();
    } catch {
      notifyError(t('team.errors.generic'));
    }
  };

  const memberRows = members.map((member) => (
    <Table.Tr key={member.id}>
      <Table.Td>
        <Text fz="sm">{member.email}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {member.companyRoles.map((roleName) => (
            <Badge
              key={roleName}
              color={roleName === 'company_owner' ? 'violet' : roleName === 'company_admin' ? 'indigo' : 'gray'}
              variant="light"
            >
              {roleLabel(t, roleName)}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{formatDateTime(member.created_at)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="sm" justify="flex-end" wrap="nowrap">
          {member.role !== 'superadmin' && (
            <LockedTooltip locked={!canManageRoles} label={t('team.locked.manageRoles')}>
              <Select
                size="xs"
                w={160}
                disabled={!canManageRoles || assignableRoleOptions.length === 0}
                data={assignableRoleOptions}
                value={member.companyRoles.length === 1 ? member.companyRoles[0] : null}
                onChange={(roleName) => changeMemberRole(member.id, roleName)}
                aria-label={t('team.members.roleChange', { email: member.email })}
              />
            </LockedTooltip>
          )}
          {member.role !== 'superadmin' && (
            <LockedTooltip locked={!canRemove} label={t('team.locked.remove')}>
              <ActionIcon
                variant="subtle"
                color="red"
                disabled={!canRemove}
                aria-label={t('team.members.removeAction', { email: member.email })}
                onClick={() => setRemoveTarget(member)}
              >
                <IconTrash size={16} stroke={1.5} />
              </ActionIcon>
            </LockedTooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const inviteRows = invites.map((invite) => {
    const expired = now !== null && new Date(invite.token_expires).getTime() < now;

    return (
      <Table.Tr key={invite.id}>
        <Table.Td>
          <Text fz="sm">{invite.email}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color="gray" variant="light">
            {roleLabel(t, invite.role)}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={6} wrap="nowrap">
            <Text fz="sm">{formatDateTime(invite.token_expires)}</Text>
            {expired && (
              <Badge color="red" variant="light" size="sm">
                {t('team.invites.expiredBadge')}
              </Badge>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap={0} justify="flex-end" wrap="nowrap">
            <LockedTooltip locked={!canInvite} label={t('team.locked.invite')}>
              <ActionIcon
                variant="subtle"
                color="blue"
                disabled={!canInvite}
                aria-label={t('team.invites.resend', { email: invite.email })}
                onClick={() => resendInvite(invite.id)}
              >
                <IconMailForward size={16} stroke={1.5} />
              </ActionIcon>
            </LockedTooltip>
            <LockedTooltip locked={!canInvite} label={t('team.locked.invite')}>
              <ActionIcon
                variant="subtle"
                color="red"
                disabled={!canInvite}
                aria-label={t('team.invites.revoke', { email: invite.email })}
                onClick={() => revokeInvite(invite.id)}
              >
                <IconTrash size={16} stroke={1.5} />
              </ActionIcon>
            </LockedTooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="lg">
      <Seo title={t('seo.pages.team')} />

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Title order={2}>{t('team.title')}</Title>
        <LockedTooltip locked={!canInvite} label={t('team.locked.invite')}>
          <Button
            leftSection={<IconUserPlus size={16} />}
            disabled={!canInvite}
            onClick={() => setInviteModalOpened(true)}
          >
            {t('team.inviteButton')}
          </Button>
        </LockedTooltip>
      </Group>

      {error ? (
        <Alert color="red" variant="light">
          {t('team.errors.loadError')}
        </Alert>
      ) : (
        <>
          <Stack gap="xs">
            <Title order={4}>{t('team.members.title')}</Title>
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('team.members.columns.email')}</Table.Th>
                    <Table.Th>{t('team.members.columns.role')}</Table.Th>
                    <Table.Th>{t('team.members.columns.joined')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading ? (
                    [1, 2, 3].map((row) => (
                      <Table.Tr key={row}>
                        {[1, 2, 3, 4].map((cell) => (
                          <Table.Td key={cell}>
                            <Skeleton height={20} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  ) : memberRows}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {!loading && members.length === 0 && (
              <Text c="dimmed" size="sm" ta="center">
                {t('team.members.empty')}
              </Text>
            )}
          </Stack>

          <Stack gap="xs">
            <Title order={4}>{t('team.invites.title')}</Title>
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('team.invites.columns.email')}</Table.Th>
                    <Table.Th>{t('team.invites.columns.role')}</Table.Th>
                    <Table.Th>{t('team.invites.columns.expires')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading ? (
                    [1, 2].map((row) => (
                      <Table.Tr key={row}>
                        {[1, 2, 3, 4].map((cell) => (
                          <Table.Td key={cell}>
                            <Skeleton height={20} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  ) : inviteRows}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {!loading && invites.length === 0 && (
              <Text c="dimmed" size="sm" ta="center">
                {t('team.invites.empty')}
              </Text>
            )}
          </Stack>
        </>
      )}

      <Modal
        opened={inviteModalOpened}
        onClose={() => {
          setInviteModalOpened(false);
          setInviteRoleError(false);
        }}
        title={t('team.inviteModal.title')}
      >
        <form onSubmit={submitInvite}>
          <Stack>
            <TextInput
              name="email"
              label={t('team.inviteModal.email')}
              placeholder={t('team.inviteModal.emailPlaceholder')}
              type="email"
              required
            />
            <Select
              label={t('team.inviteModal.role')}
              placeholder={t('team.inviteModal.rolePlaceholder')}
              data={assignableRoleOptions}
              value={inviteRole}
              onChange={(roleName) => {
                setInviteRole(roleName);
                setInviteRoleError(false);
              }}
              error={inviteRoleError ? t('team.inviteModal.roleRequired') : null}
              required
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setInviteModalOpened(false)} disabled={inviting}>
                {t('team.inviteModal.cancel')}
              </Button>
              <Button type="submit" loading={inviting}>
                {t('team.inviteModal.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={t('team.members.removeModal.title')}
      >
        <Stack>
          <Text size="sm">
            {t('team.members.removeModal.description', { email: removeTarget?.email ?? '' })}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRemoveTarget(null)} disabled={removing}>
              {t('team.members.removeModal.cancel')}
            </Button>
            <Button color="red" onClick={confirmRemove} loading={removing}>
              {t('team.members.removeModal.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default Team;
