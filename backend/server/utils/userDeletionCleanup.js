import { deleteUserSessions } from '../models/sessionModel.js';
import { countUsersInDb } from '../models/userModel.js';
import { deleteCompanyInDb } from '../models/companyModel.js';
import {
  cancelCompanySubscriptionInStripe,
  deleteSubscriptionByCompanyId,
  getSubscriptionDataInDb,
} from '../models/subscriptionModel.js';

//* Side effects shared by self- and admin-triggered user deletion:
//* - revoke all of the user's sessions
//* - when the last user of a company is gone, cancel its Stripe subscription
//*   (at period end) and remove the company's subscription + company rows
export const cleanupAfterUserDeletion = async (deletedUser) => {
  await deleteUserSessions(deletedUser.id);

  const remainingUsers = await countUsersInDb({
    company_id: deletedUser.company_id,
  });

  if (remainingUsers > 0) {
    return;
  }

  const subscriptionData = await getSubscriptionDataInDb(deletedUser.company_id);

  if (subscriptionData) {
    await cancelCompanySubscriptionInStripe(subscriptionData);
  }

  await deleteSubscriptionByCompanyId(deletedUser.company_id);
  await deleteCompanyInDb(deletedUser.company_id);
};
