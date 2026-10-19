import { useNavigate } from "react-router";
import apiClient from "../../config/API/axiosConfig.mjs";
import { usePostHog } from 'posthog-js/react'
import { IconLogout } from '@tabler/icons-react';
import classes from "../partials/NavbarSimple.module.css";

const LogOutButton = () => {

    const posthog = usePostHog()
    const navigate = useNavigate();

    const handleLogout = async () => {
    try {
        
     await apiClient.post(`/api/v1/auth/logout`)
        
        // Reset PostHog to clear user session and prevent tracking continuity
        posthog.reset();
        
        navigate('/')

    } catch (error) {
        console.error('Logout failed:', error);
    }
    
    }

    return (
        <a className={classes.link} onClick={handleLogout}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Cerrar sesión</span>
        </a>
    );

};

export default LogOutButton;