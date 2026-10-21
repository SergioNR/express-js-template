import { CronJob } from 'cron';
import { logError } from '../config/loggerFunctions.js';
import { deleteExpiredPasswordResetTokens } from '../models/passwordResetTokensModel.js';

//* waitForCompletion: a tick still running is never overlapped by the next one
export const deletePasswordResetTokensScheduler = CronJob.from({
  cronTime: '0 3 * * *',
  onTick: async () => {
    try {
      await deleteExpiredPasswordResetTokens();
    } catch (error) {
      logError('Error deleting expired password reset tokens:', error);
    }
  },
  waitForCompletion: true,
});
