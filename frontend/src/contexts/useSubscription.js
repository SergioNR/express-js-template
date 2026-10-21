import { createContext, useContext } from 'react';

//* Kept apart from SubscriptionContext.jsx so that file only exports
//* components (React Fast Refresh requirement)
export const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
};

export default useSubscription;
