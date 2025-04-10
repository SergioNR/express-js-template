import { getSubscriptionDataInDb } from '../models/subscriptionModel.mjs';

export const subscriptionChecker = (planName) => async (req, res, next) => {
  const { id } = req.user;

  const subscriptionData = getSubscriptionDataInDb(id);

  if (subscriptionData.plan_name !== planName) {
    res.status(401).json({
      success: false,
      message: 'This feature is not included in your plan',
    });
  }

  next();
};
