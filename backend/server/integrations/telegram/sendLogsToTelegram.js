import { sendTelegramMessage } from '../../config/telegramBotConfig.js';

const chatIds = {
  info: process.env.TELEGRAM_INFO_CHAT_ID,
  errors: process.env.TELEGRAM_ERRORS_CHAT_ID,
};

export const sendErrorLogsToTelegram = async (errorMessage, error) => {
  const telegramMessage = `
  🚨 <b>New error logged at ${new Date()}</b> 🚨
  \n<b>Error Name</b>: ${error.name}
  \n<b>Error Message</b>: ${errorMessage}
  \n<b>Error Details</b>: ${error}
  \n<b>Additional Info</b>: ${error.additionalInfo}
  `;

  await sendTelegramMessage(chatIds.errors, telegramMessage);
};

export const sendInfoLogsToTelegram = async (message) => {
  const telegramMessage = `
  ✅ <b>New event logged at ${new Date()}</b> ✅
  \n<b>event Name</b>: ${message}
  `;

  await sendTelegramMessage(chatIds.info, telegramMessage);
};
