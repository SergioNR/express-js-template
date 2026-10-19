import { IconArrowLeft } from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import classes from './ForgotPassword.module.css';
import { Link } from 'react-router';
import apiClient from '../../config/API/axiosConfig.mjs';
import { useState } from 'react';


 const ForgotPasswordForm = () => {
    
  const [recoverPasswordResponse, setRecoverPasswordResponse] = useState(null);
  const [recoverPasswordError, setRecoverPasswordError] = useState(null);

    const recoverPasswordRequest = async (e) => {
        
        e.preventDefault();

        const data = {
            email: e.target.email.value
        }

        try {
            const response = await apiClient.post(`/api/v1/auth/password-reset`, data);
            setRecoverPasswordResponse(response.data);
            setRecoverPasswordError(null);

        } catch (error) {

            setRecoverPasswordError({ success: false, message: "Error al recuperar la contraseña." });
            console.error("Error al recuperar la contraseña:", error);
            setRecoverPasswordResponse(null);
        }
    } 
  
  
    return (
    <Container size={460} my={30}>

        

      <Title className={classes.title} ta="center">
        ¿Has olvidado tu contraseña?
      </Title>
      <Text c="dimmed" fz="sm" ta="center">
        Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
      </Text>

      {recoverPasswordResponse && (
                          <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ccffcc' }}>
                            Pronto recibirás un enlace para restablecer tu contraseña
                          </Paper>
                        )}

      {recoverPasswordError && recoverPasswordError.success === false && (
        <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ffcccc' }}>
          {recoverPasswordError.message}
        </Paper>
      )}

      <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
        <form onSubmit={recoverPasswordRequest} method="post">
        <TextInput name="email" label="Correo electrónico" placeholder="tu@email.com" required />
        <Group justify="space-between" mt="lg" className={classes.controls}>
          <Anchor c="dimmed" component={Link} to="/auth/login" size="sm" className={classes.control}>
            <Center inline>
              <IconArrowLeft size={12} stroke={1.5} />
              <Box ml={5}>Volver a la página de inicio de sesión</Box>
            </Center>
                
          </Anchor>
          <Button type="submit" className={classes.control}>Restablecer contraseña</Button>
        </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPasswordForm;