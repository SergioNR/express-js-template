import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import apiClient from '../config/API/axiosConfig.mjs';
import { SubscriptionContext } from './useSubscription.js';

export const SubscriptionProvider = ({ children }) => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/v1/billing');
      const subscriptionData = response.data?.subscriptionData || {};

      setSubscription(subscriptionData);
    } catch {
      setError(t('billing.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);


  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  

  const hasActiveSubscription = Boolean(
    subscription?.id && subscription?.expires_at && new Date(subscription.expires_at) > new Date()
  );

  //* Companies get a Stripe customer id only when a checkout session is
  //* started - the customer portal rejects companies without one (409)
  const hasBillingId = Boolean(subscription?.has_billing_id);

  const value = {
    subscription,
    hasActiveSubscription,
    hasBillingId,
    loading,
    error,
    refresh: fetchSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

SubscriptionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SubscriptionProvider;