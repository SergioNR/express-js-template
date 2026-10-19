import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import classes from './AuthenticationTitle.module.css';
import apiClient from '../../config/API/axiosConfig.mjs';
import { Link } from "react-router";

export function LoginForm() {
  const navigate = useNavigate();
  const [loginResponse, setLoginResponse] = useState(null);
  const [participantMessage, setParticipantMessage] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setLoginResponse(null);
    setParticipantMessage(false);

    const data = {
      username: e.target.username.value,
      password: e.target.password.value,
    };

    try {
      const loginResponse = await apiClient.post('/api/v1/auth/login/local', data);

      switch (loginResponse.data.user.role) {
        case "admin":
          return navigate('/admin');
        case "customer":
          return navigate('/dashboard');
        default:
          return navigate('/');
      }
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setParticipantMessage(true);
      }
      else if (error.response?.status === 401) {
        setLoginResponse({
          type: 'error',
          message: 'La combinación de email y contraseña es incorrecta'
        });
      } else {
        setLoginResponse({
          type: 'error',
          message: 'Error interno, por favor inténtalo de nuevo más tarde'
        });
      }
    }
  };
  
  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        ¡Bienvenido de nuevo!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        ¿Aún no tienes una cuenta?{' '}
        <Anchor component={Link} to="/auth/register" size="sm">
          Crear cuenta
        </Anchor>
      </Text>
      
      {participantMessage && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Inicio de sesión de participante"
          color="yellow"
          mt={20}
        >
          El inicio de sesión de participante aún no está disponible. Por favor, contacta con soporte para más información.
        </Alert>
      )}
      
      {loginResponse && (
        <Alert
          icon={loginResponse.type === 'error' ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
          color={loginResponse.type === 'error' ? 'red' : 'green'}
          mt={20}
        >
          {loginResponse.message}
        </Alert>
      )}
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleLogin}>
          <TextInput
            name="username"
            label="Correo electrónico"
            placeholder="tu@email.com"
            required
          />
          <PasswordInput
            name="password"
            label="Contraseña"
            placeholder="Tu contraseña"
            required
            mt="md"
          />
          <Group justify="space-between" mt="lg">
            <Anchor component={Link} to="/auth/recover-password" size="sm">
              ¿Olvidaste tu contraseña?
            </Anchor>
          </Group>
          <Button type="submit" fullWidth mt="xl">
            Iniciar sesión
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default LoginForm;