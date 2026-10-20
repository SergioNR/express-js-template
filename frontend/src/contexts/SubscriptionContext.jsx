import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../config/API/axiosConfig.mjs';

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
};

export const SubscriptionProvider = ({ children }) => {
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
    } catch (err) {
      setError(err?.message ?? 'No se pudo obtener la información de la suscripción');
    } finally {
      setLoading(false);
    }
  }, []);


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

export default SubscriptionContext;