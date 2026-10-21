import { useState } from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Anchor, Burger } from '@mantine/core';
import LogInButton from '../navBarElements/LogInButton.jsx';
import RegisterButton from '../navBarElements/RegisterButton.jsx';
import styles from './SiteNavBar.module.css';

const NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/pricing', key: 'nav.pricing' },
  { to: '/preguntas-frecuentes', key: 'nav.faq' },
];

const SiteNavBar = () => {
  const { t } = useTranslation();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);

  return (
    <header className={styles.header}>

      <nav className={styles.navLinks}>
        {NAV_LINKS.map(({ to, key }) => (
          <Anchor key={key} component={NavLink} to={to} className={styles.link}>
            {t(key)}
          </Anchor>
        ))}
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
        aria-label={t('nav.menu')}
      />

      <nav className={`${styles.mobileNav} ${mobileMenuOpened ? styles.mobileNavOpen : ''}`}>
        {NAV_LINKS.map(({ to, key }) => (
          <Anchor
            key={key}
            component={NavLink}
            to={to}
            className={styles.link}
            onClick={() => setMobileMenuOpened(false)}
          >
            {t(key)}
          </Anchor>
        ))}
        <div className={styles.mobileButtonContainer}>
          <LogInButton />
          <RegisterButton />
        </div>
      </nav>
    </header>
  );
};

export default SiteNavBar;
