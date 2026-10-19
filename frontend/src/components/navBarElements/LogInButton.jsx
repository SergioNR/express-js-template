import { NavLink } from "react-router";
import { Button } from '@mantine/core';

const LogInButton = () => {
    return (
        <Button
            component={NavLink}
            to="/auth/login"
            variant="default"
            size="sm"
        >
            Iniciar sesión
        </Button>
    );
}

export default LogInButton;