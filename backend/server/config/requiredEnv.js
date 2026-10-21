import { logWarn } from './loggerFunctions.js';

//* Deployed environments fail fast when a required env var is missing. Local
//* development must boot with any of them unset, so there it only warns and
//* the feature that depends on the var fails when it is used instead
export const isLocalhost = () => process.env.DEPLOY_ENVIRONMENT === 'localhost';

export const requireEnv = (varName, refusalReason) => {
  if (process.env[varName]) {
    return true;
  }

  const message = `${varName} environment variable is not set - ${refusalReason}`;

  if (!isLocalhost()) {
    throw new Error(message);
  }

  logWarn(`${message} (ignored on localhost)`);

  return false;
};
