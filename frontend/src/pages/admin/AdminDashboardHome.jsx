import apiClient from "../../config/API/axiosConfig.mjs";
import { useState, useEffect } from "react"
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Anchor, Group, Table, Text } from '@mantine/core';

const AdminDashboard = () => {
    const [users, setUsers] = useState([])
    const [userCount, setUserCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const getAllUsers = async () => {
            try {
                const response = await apiClient.get(`/api/v1/admin/`)
                setUsers(response.data.users)
                setUserCount(response.data.users.length)
                setLoading(false)
            } catch (err) {

                setError('User is not authorized to view this page - please log in again')
                
                setLoading(false)
            }
        }

        getAllUsers()
    }, [])

    const rows = users.map((user) => (
    <Table.Tr key={user.name}>
      <Table.Td>
        <Group gap="sm">
          <Text fz="sm" fw={500}>
            {user.id}
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
          {user.role}
      </Table.Td>
      <Table.Td>
        <Anchor component="button" size="sm">
          {user.email}
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{user.last_login_at}</Text>
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{user.created_at}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon variant="subtle" color="gray">
            <IconPencil size={16} stroke={1.5} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red">
            <IconTrash size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Employee</Table.Th>
            <Table.Th>role title</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default AdminDashboard;