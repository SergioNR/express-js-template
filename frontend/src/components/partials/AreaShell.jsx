import { Link, NavLink, Outlet } from 'react-router';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { AppShell, Anchor, Burger, Group, Image, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './AreaShell.module.css';
import LogOutButton from '../navBarElements/LogOutButton';

//* Shared AppShell for the private areas (user, admin): header with brand and
//* burger, sidebar with the area's links and logout as the only exit
export const AreaShell = ({ homeTo, title, links, outletContext }) => {
  const { t } = useTranslation();
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label={t('nav.menu')}
          />
          <Anchor component={Link} to={homeTo} underline="never" inherit>
            <Group gap="xs" wrap="nowrap">
              <Image src="/logo.svg" alt={t('common.logoAlt')} h={28} w={28} />
              <Text fw={600} size="lg" component="span">{title}</Text>
            </Group>
          </Anchor>
        </Group>
      </AppShell.Header>

      {/* AppShell.Navbar provides the <nav> landmark, width, padding and border */}
      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" pb="md">
            {t('nav.navigation')}
          </Text>
        </AppShell.Section>

        <AppShell.Section grow>
          {links.map((item) => (
            <NavLink
              to={item.to}
              end={item.end}
              key={item.to}
              onClick={close}
              className={({ isActive }) => `${classes.link}${isActive ? ` ${classes.activeLink}` : ''}`}
            >
              <item.icon className={classes.linkIcon} stroke={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </AppShell.Section>

        <AppShell.Section pt="md">
          <LogOutButton />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Area pages read wrapper data (e.g. the signed-in admin) through useOutletContext() */}
        <Outlet context={outletContext} />
      </AppShell.Main>
    </AppShell>
  );
};

AreaShell.propTypes = {
  homeTo: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(PropTypes.shape({
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    end: PropTypes.bool,
  })).isRequired,
  outletContext: PropTypes.object,
};

export default AreaShell;
