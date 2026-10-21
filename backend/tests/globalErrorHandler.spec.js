import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const { globalErrorHandler } = await import('../server/middlewares/globalErrorHandler.js');
const { logError, logWarn } = await import('../server/config/loggerFunctions.js');

const createMockRes = () => {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockReq = () => ({ method: 'POST', path: '/api/v1/auth/login' });

describe('globalErrorHandler', () => {
  const originalDeployEnvironment = process.env.DEPLOY_ENVIRONMENT;

  afterEach(() => {
    process.env.DEPLOY_ENVIRONMENT = originalDeployEnvironment;
    jest.clearAllMocks();
  });

  it('respects err.statusCode when present', () => {
    process.env.DEPLOY_ENVIRONMENT = 'localhost';
    const res = createMockRes();
    const error = Object.assign(new Error(' Gone'), { statusCode: 410 });

    globalErrorHandler(error, createMockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(410);
  });

  it('falls back to 500 for errors without a status', () => {
    process.env.DEPLOY_ENVIRONMENT = 'localhost';
    const res = createMockRes();

    globalErrorHandler(new Error('boom'), createMockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('falls back to 500 for out-of-range status values', () => {
    const res = createMockRes();

    globalErrorHandler(Object.assign(new Error('weird'), { status: 200 }), createMockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('keeps body-parser errors as 400 instead of 500', () => {
    process.env.DEPLOY_ENVIRONMENT = 'production';
    const res = createMockRes();
    const error = Object.assign(new SyntaxError('Unexpected token } in JSON'), {
      status: 400,
      type: 'entity.parse.failed',
      body: '{"password":"hunter2"}',
    });

    globalErrorHandler(error, createMockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      name: 'Bad Request',
      message: 'The request could not be processed',
    });
  });

  it('hides error details outside localhost', () => {
    process.env.DEPLOY_ENVIRONMENT = 'production';
    const res = createMockRes();

    globalErrorHandler(new Error('sensitive stack detail'), createMockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      name: 'Internal Server Error',
      message: 'An error occurred, please try again later',
    });
  });

  it('returns error details on localhost', () => {
    process.env.DEPLOY_ENVIRONMENT = 'localhost';
    const res = createMockRes();

    globalErrorHandler(new TypeError('debug detail'), createMockReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      name: 'TypeError',
      message: 'debug detail',
    });
  });

  it('logs server errors with logError', () => {
    process.env.DEPLOY_ENVIRONMENT = 'production';
    const res = createMockRes();
    const error = new Error('boom');

    globalErrorHandler(error, createMockReq(), res, jest.fn());

    expect(logError).toHaveBeenCalledWith('Error', error);
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('logs client errors as warnings only (no Telegram alert)', () => {
    process.env.DEPLOY_ENVIRONMENT = 'production';
    const res = createMockRes();
    const error = Object.assign(new Error('too large'), { status: 413 });

    globalErrorHandler(error, createMockReq(), res, jest.fn());

    expect(logWarn).toHaveBeenCalledWith('Client error 413 on POST /api/v1/auth/login', error);
    expect(logError).not.toHaveBeenCalled();
  });

  it('delegates to Express when headers were already sent', () => {
    const res = createMockRes();
    res.headersSent = true;
    const next = jest.fn();
    const error = new Error('mid-stream');

    globalErrorHandler(error, createMockReq(), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
});
