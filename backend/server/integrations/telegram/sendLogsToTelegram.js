import { sendTelegramMessage } from '../../config/telegramBotConfig.js';

const chatIds = {
  errors: process.env.TELEGRAM_ERRORS_CHAT_ID,
};

//* Telegram hard limit is 4096 chars per message
const MAX_FIELD_LENGTH = 1000;

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

//* Messages are sent with parse_mode=HTML, so every interpolated value must be
//* escaped - otherwise a `<` in an error message breaks delivery, and
//* attacker-controlled text could inject markup/links into the alert
const stringify = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

export const escapeHtml = (value) => {
  const text = stringify(value);
  const truncated = text.length > MAX_FIELD_LENGTH ? `${text.slice(0, MAX_FIELD_LENGTH)}...` : text;

  return truncated.replace(/[&<>"]/g, (char) => HTML_ENTITIES[char]);
};

//* Only errors reach Telegram - info and warnings stay in pino (see
//* config/loggerFunctions.js), so there is no info chat sender anymore
export const sendErrorLogsToTelegram = async (errorMessage, error = {}, additionalInfo = 'N/A') => {
  const telegramMessage = `
  🚨 <b>New error logged at ${new Date().toISOString()}</b> 🚨
  \n<b>Error Name</b>: ${escapeHtml(error.name ?? 'N/A')}
  \n<b>Error Message</b>: ${escapeHtml(errorMessage)}
  \n<b>Error Details</b>: ${escapeHtml(error.message ?? 'N/A')}
  \n<b>Additional Info</b>: ${escapeHtml(additionalInfo)}
  `;

  await sendTelegramMessage(chatIds.errors, telegramMessage);
};
