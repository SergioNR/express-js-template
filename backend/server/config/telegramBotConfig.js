//* Telegram is an optional alert channel - without a bot key every send is a
//* no-op so local development and test environments never hit the network
export const isTelegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_API_KEY);

export const sendTelegramMessage = async (chatId, message) => {
  if (!isTelegramConfigured() || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_KEY}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
};

//* DOCS --> https://core.telegram.org/bots/api#sendmessage
