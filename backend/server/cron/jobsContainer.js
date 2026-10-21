import { logError, logInfo } from '../config/loggerFunctions.js';
import { deletePasswordResetTokensScheduler } from './deletePasswordResetTokensScheduler.js';
import { deleteTeamInvitesScheduler } from './deleteTeamInvitesScheduler.js';
import { deletePendingFileUploadsScheduler } from './deletePendingFileUploadsScheduler.js';

export const startCronJobs = () => {
  logInfo('Starting cron jobs');
  try {
    deletePasswordResetTokensScheduler.start();
    deleteTeamInvitesScheduler.start();
    deletePendingFileUploadsScheduler.start();
  } catch (error) {
    logError('error on startCronJobs', error);
  }
};
