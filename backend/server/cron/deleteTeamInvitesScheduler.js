import { CronJob } from 'cron';
import { logError } from '../config/loggerFunctions.js';
import { deleteExpiredTeamInvites } from '../models/teamInvitesModel.js';

export const deleteTeamInvitesScheduler = new CronJob(
  '0 3 * * *',
  async () => {
    try {
      await deleteExpiredTeamInvites();
    } catch (error) {
      logError('Error deleting expired team invites:', error);
    }
  },
);
