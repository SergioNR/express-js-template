import { CronJob } from 'cron';
import { logError } from '../config/loggerFunctions.js';
import { deleteExpiredPasswordResetTokens } from '../models/passwordResetTokensModel.js';

export const deletePasswordResetTokensScheduler = new CronJob(
  '0 3 * * *',
  async () => {
    try {
      await deleteExpiredPasswordResetTokens();
    } catch (error) {
      logError('Error deleting expired password reset tokens:', error);
    }
  },
);
