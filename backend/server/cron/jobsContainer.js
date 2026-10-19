import { logError, logInfo } from '../config/loggerFunctions.js';
import { deletePasswordResetTokensScheduler } from './deletePasswordResetTokensScheduler.js';

export const startCronJobs = () => {
  logInfo('Starting cron jobs');
  try {
    deletePasswordResetTokensScheduler.start();
  } catch (error) {
    logError('error on startCronJobs', error);
  }
};
