import { sendTelegramMessage } from '../../config/telegramBotConfig.mjs';

export const sendErrorLogsToTelegram = async (error) => {
  const chatId = process.env.TELEGRAM_BOT_LOGS_CHAT_ID; // Flightsnatch error logs group
  const message = `
  🚨 <b>New error logged at ${new Date()}</b> 🚨
  \n<b>Error Name</b>: ${error.name}
  \n<b>Error Message</b>: ${error.message}
  \n<b>Error Details</b>: ${error}
  \n<b>Additional Info</b>: ${error.additionalInfo}
  
  \n Access logs here --> https://telemetry.betterstack.com/team/111402/tail?s=1198475,1198477
  `;

  await sendTelegramMessage(chatId, message);
};
