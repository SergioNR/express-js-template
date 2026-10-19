import { useState } from 'react';
import { NavLink } from 'react-router';
import { Anchor, Image, Burger } from '@mantine/core';
import LogInButton from '../navBarElements/LogInButton.jsx';
import RegisterButton from '../navBarElements/RegisterButton.jsx';
import styles from './SiteNavBar.module.css';

const SiteNavBar = () => {
    const [mobileMenuOpened, setMobileMenuOpened] = useState(false);

    return (
        <header className={styles.header}>
            {/* <div className={styles.logoContainer}>
                <NavLink to="/">
                    <Image src="/logo.svg" alt="logo" width={40} height={40} />
                </NavLink>
            </div> */}

            <nav className={styles.navLinks}>
                <Anchor component={NavLink} to="/" className={styles.link}>
                    Home
                </Anchor>
                <Anchor component={NavLink} to="/pricing" className={styles.link}>
                    Precio
                </Anchor>
                <Anchor component={NavLink} to="/preguntas-frecuentes" className={styles.link}>
                    Preguntas frecuentes
                </Anchor>
            </nav>

            <div className={styles.buttonContainer}>
                <LogInButton />
                <RegisterButton />
            </div>

            <Burger
                opened={mobileMenuOpened}
                onClick={() => setMobileMenuOpened(!mobileMenuOpened)}
                className={styles.mobileMenuButton}
                size="sm"
            />

            <nav className={`${styles.mobileNav} ${mobileMenuOpened ? styles.mobileNavOpen : ''}`}>
                <Anchor
                    component={NavLink}
                    to="/"
                    className={styles.link}
                    onClick={() => setMobileMenuOpened(false)}
                >
                    Home
                </Anchor>
                <Anchor
                    component={NavLink}
                    to="/pricing"
                    className={styles.link}
                    onClick={() => setMobileMenuOpened(false)}
                >
                    Precio
                </Anchor>
                <Anchor
                    component={NavLink}
                    to="/preguntas-frecuentes"
                    className={styles.link}
                    onClick={() => setMobileMenuOpened(false)}
                >
                    Preguntas frecuentes
                </Anchor>
                <div className={styles.mobileButtonContainer}>
                    <LogInButton />
                    <RegisterButton />
                </div>
            </nav>
        </header>
    );
};

export default SiteNavBar;