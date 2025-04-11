import axios from 'axios';

const telegramBotToken = process.env.TELEGRAM_BOT_API_KEY;

export const sendTelegramMessage = async (chatId, message) => {
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
