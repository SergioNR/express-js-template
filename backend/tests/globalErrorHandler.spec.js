import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
}));

const { globalErrorHandler } = await import('../server/middlewares/globalErrorHandler.js');
const { logError } = await import('../server/config/loggerFunctions.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('globalErrorHandler', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('respects err.statusCode when present', () => {
    process.env.NODE_ENV = 'development';
    const res = createMockRes();
    const error = Object.assign(new Error(' Gone'), { statusCode: 410 });

    globalErrorHandler(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(410);
  });

  it('falls back to 500 for errors without a status', () => {
    process.env.NODE_ENV = 'development';
    const res = createMockRes();

    globalErrorHandler(new Error('boom'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('hides error details outside development', () => {
    process.env.NODE_ENV = 'production';
    const res = createMockRes();

    globalErrorHandler(new Error('sensitive stack detail'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      name: 'Internal Server Error',
      message: 'An error occurred, please try again later',
    });
  });

  it('always logs the error', () => {
    process.env.NODE_ENV = 'production';
    const res = createMockRes();
    const error = new Error('boom');

    globalErrorHandler(error, {}, res, jest.fn());

    expect(logError).toHaveBeenCalled();
  });
});
