import apiClient from "../../config/API/axiosConfig.mjs"
import { useState } from "react"
import { Link } from "react-router";
import {
    Anchor,
    Button,
    Container,
    Paper,
    PasswordInput,
    Text,
    TextInput,
    Title,
  } from '@mantine/core';
  import classes from './AuthenticationTitle.module.css';
import { useNavigate } from 'react-router';


const CustomerRegistrationForm = () => {

const [registerResponse, setRegisterResponse] = useState(null)
const [registerError, setRegisterError] = useState(null)
const [countdown, setCountdown] = useState(null)
    const navigate = useNavigate();


const handleRegister = async (e) => {
    e.preventDefault()

    const data = {
        username: e.target.username.value,
        password: e.target.password.value,
    }
    
    try {
        await apiClient.post(`/api/v1/auth/register/local/user`, data)
        
        setRegisterResponse({
            success: true,
            message: 'Usuario creado correctamente - Redirigiendo al inicio de sesión'
        })

        setRegisterError(null)

        setCountdown(3);
            const timer = setInterval(() => {
                setCountdown(prevCountdown => {
                    if (prevCountdown <= 1) {
                        clearInterval(timer);
                        navigate('/auth/login');
                        return 0;
                    }
                    return prevCountdown - 1;
                });
            }, 1000);

        
        
    } catch (err) {

        setRegisterResponse(null)

        if (err.status === 409) {
            return setRegisterError({
                success: false,
                message: 'No ha sido posible crear un usuario con este correo electrónico'
            })
        }

        if (err.status === 422) {
            return setRegisterError({
                success: false,
                message: 'Por favor, proporcione un correo electrónico y contraseña válidos'
            })
        }



        return setRegisterError({
            success: false,
            message: 'Error interno, por favor intentálo en unos minutos'
        })
    }
}

return (
    <>
                        <Container size={420} my={40}>
                        <Title ta="center" className={classes.title}>
                          ¡Estamos encantados de verte por aqui!
                        </Title>
                        <Text c="dimmed" size="sm" ta="center" mt={5}>
                          ¿Ya tienes una cuenta?{' '}
                          <Anchor component={Link} to="/auth/login" size="sm">
                            Iniciar sesión
                          </Anchor>

                        </Text>

                        {registerResponse && (
                          <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ccffcc' }}>
                            {registerResponse.message}
                          </Paper>
                        )}

                        {registerError && registerError.success === false && (
                          <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ffcccc' }}>
                            {registerError.message}
                          </Paper>
                        )}
                        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                          <form onSubmit={handleRegister}>
                            <TextInput name="username" label="Correo electrónico" placeholder="tu@ejemplo.com" required  />
                            <PasswordInput name="password" label="Contraseña" placeholder="Tu contraseña" required mt="md" />

                            <Button type="submit" fullWidth mt="xl">
                              Crear cuenta
                            </Button>
                          </form>
                          <Text size="sm" c="dimmed" className="terms-and-conditions" style={{ textAlign: 'center', marginTop: '10px' }}>
       Al registrarte, aceptas estar de acuerdo con los{" "}
       <Link to="/terminos-condiciones">términos y condiciones</Link>
     </Text>
                        </Paper>
                        </Container>
                    </>
)};

export default CustomerRegistrationForm