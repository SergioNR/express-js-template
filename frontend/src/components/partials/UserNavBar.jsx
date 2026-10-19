import { NavLink } from 'react-router'
import { useState } from 'react';
import {
  IconHomeFilled,
  IconUserCircle,
  IconCreditCardFilled
} from '@tabler/icons-react';
import classes from './NavbarSimple.module.css';
import LogOutButton from '../navBarElements/LogOutButton';


const UserNavBar = () => {

  const [active, setActive] = useState('Dashboard');

  const data = [
  { link: '/dashboard', label: 'Dashboard', icon: IconHomeFilled },
  { link: '/user/profile', label: 'Cambiar contraseña', icon: IconUserCircle },
  { link: '/user/billing', label: 'Planes', icon: IconCreditCardFilled },
];

  const links = data.map((item) => (
    <NavLink to={item.link} key={item.label} className={classes.link} data-active={item.label === active || undefined} onClick={() => setActive(item.label)}>
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    <nav className={classes.navbar}>
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
