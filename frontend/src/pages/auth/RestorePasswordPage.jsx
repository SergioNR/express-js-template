import apiClient from '../../config/API/axiosConfig.mjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Text,
  Title,
  PasswordInput,
  Alert,
  Loader,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconArrowLeft } from '@tabler/icons-react';
import classes from '../../components/auth/ForgotPassword.module.css';
import { Link } from 'react-router';


const RestorePasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [passwordUpdateResponse, setPasswordUpdateResponse] = useState(null);
    const [passwordResetTokenValidity, setPasswordResetTokenValidity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMismatch, setPasswordMismatch] = useState(false);

    // Get a specific query parameter
    const passwordResetToken = searchParams.get('passwordResetToken');


    useEffect(() => {
        const checkPasswordResetTokenValidity = async () => {
            try {
                const response = await apiClient.get(`/api/v1/auth/password-reset?passwordResetToken=${passwordResetToken}`);
                setPasswordResetTokenValidity(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error checking password reset token validity:', error);
                setError(error.message || 'Invalid or expired password reset token');
                setLoading(false);
            }
        };

        if (passwordResetToken) {
            checkPasswordResetTokenValidity();
        } else {
            setError('No password reset token provided');
            setLoading(false);
        }
    }, [passwordResetToken]);

    const updateRecoveredPassword = async (e) => {
        e.preventDefault();
        
        // Check if passwords match
        if (newPassword !== confirmNewPassword) {
            setPasswordMismatch(true);
            return;
        }
        
        setPasswordMismatch(false);
        setLoading(true);
        
        try {
            const formData = {
                passwordResetToken: passwordResetToken,
                newPassword: newPassword,
                confirmNewPassword: confirmNewPassword,
            };

            const response = await apiClient.patch(`/api/v1/auth/password-reset`, formData);

            setPasswordUpdateResponse(response.data);
            setLoading(false);
        } catch (error) {
            setError(error.message || 'Failed to update password');
            setLoading(false);
        }
    };
    
    return (
        <Container size={460} my={30}>
            <Title className={classes.title} ta="center">
                Restablecer contraseña
            </Title>

            {loading && (
                <Center mt="xl">
                    <Loader />
                </Center>
            )}

            
            

            {passwordUpdateResponse ? (
                <Paper shadow="xs" p={20} mt="xl" radius="md">
                    <Alert
                        icon={passwordUpdateResponse.success ? <IconCheck size="1rem" /> : <IconAlertCircle size="1rem" />}
                        color={passwordUpdateResponse.success ? "green" : "red"}
                        title={passwordUpdateResponse.success ? "Success" : "Error"}
                    >
                        {passwordUpdateResponse.message}
                    </Alert>
                    
                    {passwordUpdateResponse.success && (
                        <Center mt="xl">
                            <Anchor component={Link} to="/auth/login">
                                <Button variant="outline" leftSection={<IconArrowLeft size="1rem" />}>
                                    Volver al inicio de sesión
                                </Button>
                            </Anchor>
                        </Center>
                    )}
                </Paper>
            ) : (
                passwordResetTokenValidity?.success ? (
                    <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
                        <form onSubmit={updateRecoveredPassword}>
                            <PasswordInput
                                label="Nueva contraseña"
                                placeholder="Introduce tu nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                mt="md"
                            />
                            
                            <PasswordInput
                                label="Confirmar nueva contraseña"
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                mt="md"
                            />
                            
                            {passwordMismatch && (
                                <Alert
                                    icon={<IconAlertCircle size="1rem" />}
                                    title="Error"
                                    color="red"
                                    mt="md"
                                >
                                    Las contraseñas no coinciden
                                </Alert>
                            )}
                            
                            <Group justify="space-between" mt="lg" className={classes.controls}>
                                <Anchor c="dimmed" component={Link} to="/auth/login" size="sm" className={classes.control}>
                                    <Center inline>
                                        <IconArrowLeft size={12} stroke={1.5} />
                                        <Box ml={5}>Volver a la página de inicio de sesión</Box>
                                    </Center>
                                </Anchor>
                                <Button
                                    type="submit"
                                    className={classes.control}
                                    loading={loading}
                                >
                                    Actualizar contraseña
                                </Button>
                            </Group>
                        </form>
                    </Paper>
                ) : (
                    <Paper shadow="xs" p={20} mt="xl" radius="md">
                        <Alert
                            icon={<IconAlertCircle size="1rem" />}
                            title="Enlace inválido"
                            color="red"
                        >
                            El enlace para restablecer la contraseña es inválido o ha expirado. Por favor, solicita un nuevo enlace.
                        </Alert>
                        
                        <Center mt="xl">
                            <Anchor component={Link} to="/auth/recover-password">
                                <Button variant="outline" leftSection={<IconArrowLeft size="1rem" />}>
                                    Solicitar nuevo enlace
                                </Button>
                            </Anchor>
                        </Center>
                    </Paper>
                )
            )}
        </Container>
    );
};

export default RestorePasswordPage;