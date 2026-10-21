import { jest } from '@jest/globals';

const loggerMock = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

jest.unstable_mockModule('../server/config/logger.js', () => ({
  logger: loggerMock,
}));

jest.unstable_mockModule('../server/config/telegramBotConfig.js', () => ({
  sendTelegramMessage: jest.fn().mockResolvedValue(true),
}));

const { logError, logWarn, serializeError } = await import('../server/config/loggerFunctions.js');
const { escapeHtml } = await import('../server/integrations/telegram/sendLogsToTelegram.js');
const { sendTelegramMessage } = await import('../server/config/telegramBotConfig.js');

describe('serializeError', () => {
  it('keeps only name, message, code, status and stack', () => {
    const error = Object.assign(new Error('bad json'), {
      status: 400,
      code: 'E_PARSE',
      body: '{"password":"hunter2"}',
      headers: { cookie: 'app.sid=secret' },
    });

    const serialized = serializeError(error);

    expect(Object.keys(serialized).sort()).toEqual(['code', 'message', 'name', 'stack', 'status']);
    expect(JSON.stringify(serialized)).not.toContain('hunter2');
    expect(JSON.stringify(serialized)).not.toContain('secret');
  });

  it('handles missing and non-object errors', () => {
    expect(serializeError(undefined)).toEqual({ name: 'UnknownError', message: 'no error provided' });
    expect(serializeError('plain string')).toEqual({ name: 'NonErrorThrown', message: 'plain string' });
  });
});

describe('log functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logError never logs the raw error object', () => {
    const error = Object.assign(new Error('boom'), { body: 'secret-body' });

    logError('Something failed', error);

    const [payload] = loggerMock.error.mock.calls[0];
    expect(payload.context.errorDetails).not.toBe(error);
    expect(JSON.stringify(payload)).not.toContain('secret-body');
  });

  it('logWarn tolerates a missing error', async () => {
    await expect(logWarn('Just a warning')).resolves.toBeUndefined();
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it('escapes HTML in the Telegram error message', () => {
    logError('<script>alert(1)</script>', new Error('a < b & "c"'));

    const [, message] = sendTelegramMessage.mock.calls[0];
    expect(message).not.toContain('<script>');
    expect(message).toContain('&lt;script&gt;');
    expect(message).toContain('a &lt; b &amp; &quot;c&quot;');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters and stringifies objects', () => {
    expect(escapeHtml('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
    expect(escapeHtml({ a: '<x>' })).toBe('{&quot;a&quot;:&quot;&lt;x&gt;&quot;}');
  });

  it('truncates very long values', () => {
    expect(escapeHtml('x'.repeat(5000)).length).toBeLessThan(1100);
  });
});
