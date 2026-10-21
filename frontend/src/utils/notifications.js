import { createElement } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

export const notifySuccess = (message, title) => {
  notifications.show({
    message,
    title,
    color: 'teal',
    autoClose: 4000,
  });
};

//* Neutral outcome (e.g. a cancelled checkout) - neither success nor failure
export const notifyInfo = (message, title) => {
  notifications.show({
    message,
    title,
    color: 'gray',
    autoClose: 5000,
  });
};

export const notifyError = (message, title) => {
  notifications.show({
    message,
    title,
    color: 'red',
    icon: createElement(IconAlertCircle, { size: '1.1rem' }),
    autoClose: 6000,
  });
};
