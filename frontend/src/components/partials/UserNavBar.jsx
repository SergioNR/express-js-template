import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  IconHomeFilled,
  IconUserCircle,
  IconCreditCardFilled,
  IconUsersGroup
} from '@tabler/icons-react';
import classes from './NavbarSimple.module.css';
import LogOutButton from '../navBarElements/LogOutButton';

const UserNavBar = () => {
  const { t } = useTranslation();

  const data = [
    { link: '/dashboard', label: t('nav.user.dashboard'), icon: IconHomeFilled },
    { link: '/user/profile', label: t('nav.user.profile'), icon: IconUserCircle },
    { link: '/user/billing', label: t('nav.user.plans'), icon: IconCreditCardFilled },
    { link: '/user/team', label: t('nav.user.team'), icon: IconUsersGroup },
  ];

  const links = data.map((item) => (
    <NavLink
      to={item.link}
      key={item.label}
      className={({ isActive }) => `${classes.link}${isActive ? ` ${classes.activeLink}` : ''}`}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <span className={classes.sectionTitle}>{t('nav.user.navigation')}</span>
      </div>

      <div className={classes.navbarMain}>
        {links}
      </div>

      <div className={classes.footer}>
        <LogOutButton />
      </div>
    </nav>
  );
};

export default UserNavBar;
