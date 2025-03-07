import axios from 'axios';

const telegramBotToken = process.env.TELEGRAM_BOT_API_KEY;

export const sendTelegramErrorLogsToGroup = async (errorData) => {
  const chatId = process.env.TELEGRAM_BOT_LOGS_CHAT_ID; // Flightsnatch error logs group

  const message = `
  🚨 <b>New error logged at ${new Date()}</b> 🚨
  \n<b>Error name</b>: ${errorData.message}
  \n<b>Error context</b>: ${errorData.context.name}
  \n<b>Error Message</b>: ${errorData.context.errorMessage}
  \n<b>Additional Info</b>: ${errorData.context.additionalInfo}
  
  \n Access logs here --> https://telemetry.betterstack.com/team/111402/tail?s=1198475,1198477
  `;

  try {
    await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
