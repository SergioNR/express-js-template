import { sendTelegramMessage } from '../../config/telegramBotConfig.mjs';

export const sendErrorLogsToTelegram = async (error) => {
  const chatId = process.env.TELEGRAM_BOT_LOGS_CHAT_ID; // Flightsnatch error logs group
  const message = `
  🚨 <b>New error logged at ${new Date()}</b> 🚨
  \n<b>Error name</b>: ${error.message}
  \n<b>Error context</b>: ${error.context.name}
  \n<b>Error Message</b>: ${error.context.errorMessage}
  \n<b>Additional Info</b>: ${error.context.additionalInfo}
  
  \n Access logs here --> https://telemetry.betterstack.com/team/111402/tail?s=1198475,1198477
  `;

  await sendTelegramMessage(chatId, message);
};
