import { useState } from 'react';
import apiClient from '../../config/API/axiosConfig.mjs';
import { Card, Button, TextInput, Text, Alert, Box } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

const PasswordUpdateForm = () => {
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponse(null);

        try {
            const passwordUpdateData = {
                currentPassword: e.target.currentPassword.value,
                newPassword: e.target.newPassword.value,
            };

            const response = await apiClient.patch(`/api/v1/auth/update-user-password`, passwordUpdateData);
            setResponse({
                success: true,
                message: response.data.message
            });

        } catch (error) {

            if (error.response && error.response.status === 401) {
                setResponse({
                    success: false,
                    message: error.response.data.message
                });
            } else if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data.message;
                
                // Check if message is an array of validation objects
                if (Array.isArray(errorMessage)) {
                    setResponse({
                        success: false,
                        message: errorMessage.map(err => err.msg)
                    });
                } else {
                    setResponse({
                        success: false,
                        message: errorMessage
                    });
                }
            } else {
                // Handle other errors (network errors, server errors, etc)
                setResponse({
                    success: false,
                    message: 'An unexpected error occurred. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder mt="lg">
            <Text size="lg" weight={600} mb="md">Cambiar contraseña</Text>
            
            {response && (
                <Box mb="md">
                    {response.success === false ? (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                            {Array.isArray(response.message) ? (
                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                    {response.message.map((msg, index) => (
                                        <li key={index}>{msg}</li>
                                    ))}
                                </ul>
                            ) : (
                                <Text>{response.message}</Text>
                            )}
                        </Alert>
                    ) : (
                        <Alert title="¡Hecho!" color="green">
                            <Text>La contraseña ha sido modificado con éxito</Text>
                        </Alert>
                    )}
                </Box>
            )}
            
            <form onSubmit={handleSubmit}>
                <TextInput
                    label="nombre de usuario"
                    name="username"
                    type="text"
                    autoComplete='username'
                    placeholder="Introduce tu nombre de usuario"
                    mb="md"
                    style={{ display: 'none' }}
                />
                
                <TextInput
                    label="Contraseña actual"
                    name="currentPassword"
                    type="password"
                    autoComplete='current-password'
                    placeholder="Introduce tu contraseña actual"
                    required
                    mb="md"
                />
                
                <TextInput
                    label="Nueva contraseña"
                    name="newPassword"
                    type="password"
                    autoComplete='new-password'
                    placeholder="Introduce tu nueva contraseña"
                    required
                    mb="md"
                />
                
                <Button 
                    type="submit" 
                    loading={loading}
                    fullWidth
                >
                    Cambiar contraseña
                </Button>
            </form>
        </Card>
    );
};

export default PasswordUpdateForm;