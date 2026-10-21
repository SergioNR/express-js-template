import { CronJob } from 'cron';
import { logError } from '../config/loggerFunctions.js';
import { deleteExpiredTeamInvites } from '../models/teamInvitesModel.js';

//* waitForCompletion: a tick still running is never overlapped by the next one
export const deleteTeamInvitesScheduler = CronJob.from({
  cronTime: '0 3 * * *',
  onTick: async () => {
    try {
      await deleteExpiredTeamInvites();
    } catch (error) {
      logError('Error deleting expired team invites:', error);
    }
  },
  waitForCompletion: true,
});
