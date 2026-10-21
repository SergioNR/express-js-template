import { deleteUserSessions } from '../models/sessionModel.js';
import { countUsersInDb } from '../models/userModel.js';
import { deleteCompanyInDb } from '../models/companyModel.js';
import { getFileKeysForCompanyInDb } from '../models/filesModel.js';
import { deleteS3Objects } from '../integrations/s3/deleteS3Objects.js';
import {
  cancelCompanySubscriptionInStripe,
  deleteSubscriptionByCompanyId,
  getSubscriptionDataInDb,
} from '../models/subscriptionModel.js';

//* Side effects shared by self- and admin-triggered user deletion:
//* - revoke all of the user's sessions
//* - when the last user of a company is gone, cancel its Stripe subscription
//*   (at period end) and remove the company's subscription + company rows,
//*   together with the company's file objects in the bucket
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

  //* The company delete cascades the File rows - the keys must be collected
  //* first so the bucket objects can be cleaned up after the rows are gone
  const companyFileKeys = await getFileKeysForCompanyInDb(deletedUser.company_id);

  await deleteCompanyInDb(deletedUser.company_id);

  await deleteS3Objects(companyFileKeys);
};
