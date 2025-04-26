import { logError } from '../config/loggerFunctions.mjs';
import { deletePasswordResetTokensScheduler } from './deletePasswordResetTokensScheduler.mjs';

export const startCronJobs = () => {
  try {
    deletePasswordResetTokensScheduler.start();

    console.log('Cron jobs started');
  } catch (error) {
    logError('error on startCronJobs', error);
  }
};
