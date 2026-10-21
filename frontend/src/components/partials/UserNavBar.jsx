import { NavLink } from 'react-router';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { AppShell, Text } from '@mantine/core';
import {
  IconHomeFilled,
  IconUserCircle,
  IconCreditCardFilled,
  IconUsersGroup
} from '@tabler/icons-react';
import classes from './NavbarSimple.module.css';
import LogOutButton from '../navBarElements/LogOutButton';

//* Rendered inside <AppShell.Navbar>, which already provides the <nav>
//* landmark, width, padding and border
const UserNavBar = ({ onNavigate }) => {
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
      onClick={onNavigate}
      className={({ isActive }) => `${classes.link}${isActive ? ` ${classes.activeLink}` : ''}`}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    <>
      <AppShell.Section>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" pb="md">
          {t('nav.user.navigation')}
        </Text>
      </AppShell.Section>

      <AppShell.Section grow>
        {links}
      </AppShell.Section>

      <AppShell.Section pt="md">
        <LogOutButton />
      </AppShell.Section>
    </>
  );
};

UserNavBar.propTypes = {
  onNavigate: PropTypes.func,
};

export default UserNavBar;
