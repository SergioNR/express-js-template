import { CronJob } from 'cron';
import { logError } from '../config/loggerFunctions.mjs';

export const deletePasswordResetTokensScheduler = new CronJob(
  '0 3 * * *',
  async () => {
    try {
      const { deleteExpiredPasswordResetTokens } = await import(
        '../models/passwordResetTokensModel.mjs'
      );
      await deleteExpiredPasswordResetTokens();
    } catch (error) {
      logError('Error deleting expired password reset tokens:', error);
    }
  },
);
