import { useState } from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Anchor, Burger } from '@mantine/core';
import LogOutButton from '../navBarElements/LogOutButton';
import styles from './AdminNavBar.module.css';

const NAV_LINKS = [
  { to: '/admin', key: 'admin.nav.overview', end: true },
  { to: '/admin/users', key: 'admin.nav.users', end: false },
  { to: '/admin/companies', key: 'admin.nav.companies', end: false },
];

const AdminNavBar = () => {
  const { t } = useTranslation();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);

  return (
    <header className={styles.header}>

      <Anchor component={NavLink} to="/admin" underline="never" className={styles.brand}>
        <img src="/logo.svg" alt={t('common.logoAlt')} className={styles.brandLogo} />
        <span className={styles.brandTitle}>{t('admin.areaTitle')}</span>
      </Anchor>

      <nav className={styles.navLinks}>
        {NAV_LINKS.map(({ to, key, end }) => (
          <Anchor
            key={key}
            component={NavLink}
            to={to}
            end={end}
            underline="never"
            className={styles.link}
          >
            {t(key)}
          </Anchor>
        ))}
      </nav>

      <div className={styles.actions}>
        <LogOutButton />
      </div>

      <Burger
        opened={mobileMenuOpened}
        onClick={() => setMobileMenuOpened((opened) => !opened)}
        className={styles.burger}
        size="sm"
        aria-label={t('admin.nav.menu')}
      />

      <nav className={`${styles.mobileNav} ${mobileMenuOpened ? styles.mobileNavOpen : ''}`}>
        {NAV_LINKS.map(({ to, key }) => (
          <Anchor
            key={key}
            component={NavLink}
            to={to}
            underline="never"
            className={styles.link}
            onClick={() => setMobileMenuOpened(false)}
          >
            {t(key)}
          </Anchor>
        ))}
        <div className={styles.mobileActions}>
          <LogOutButton />
        </div>
      </nav>
    </header>
  );
};

export default AdminNavBar;
