import { useState } from 'react'
import apiClient from '../../config/API/axiosConfig.mjs'
import { useNavigate } from 'react-router'

import { IconAlertCircle } from '@tabler/icons-react';

import {
  Card,
  Button,
  Alert,
  Title,
  Text,
  Box,

  Group
} from '@mantine/core';



export const AccountActionsForm = () => {

    const [error, setError] = useState(null)
    const navigate = useNavigate();

    const deleteUser = async () => {
                try {
                    const response = await apiClient.delete(`/api/v1/user`);
    
                    if (response.status === 200) {
                        navigate('/');
                    }
    
                } catch (err) {
                    setError(err.message);
                }
            }

            if (error) return (
        <Box sx={{ maxWidth: 600 }} mx="auto" mt="xl">
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                {error}
            </Alert>
        </Box>)

return (
<Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Account Actions</Title>
                <Text size="sm" color="dimmed" mb="md">
                    Manage your account settings and preferences
                </Text>
                
                <Group position="left" mt="md">
                    <Button
                        color="red"
                        onClick={deleteUser}
                    >
                        Delete my account
                    </Button>
                </Group>
            </Card>
)}