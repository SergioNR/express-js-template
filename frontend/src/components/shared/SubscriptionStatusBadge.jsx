import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@mantine/core';
import PropTypes from 'prop-types';

//* Mirrors the backend/client definition of an active subscription:
//* an existing `expires_at` in the future (null counts as inactive)
export const SubscriptionStatusBadge = ({ subscription }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const active = Boolean(
    subscription?.expires_at && now !== null && new Date(subscription.expires_at).getTime() > now
  );

  return (
    <Badge color={active ? 'teal' : 'red'} variant="light">
      {active ? t('billing.statusActive') : t('billing.statusInactive')}
    </Badge>
  );
};

SubscriptionStatusBadge.propTypes = {
  subscription: PropTypes.shape({
    expires_at: PropTypes.string,
  }),
};

export default SubscriptionStatusBadge;
