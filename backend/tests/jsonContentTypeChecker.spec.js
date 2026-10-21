import { jest } from '@jest/globals';

const { checkJsonContentType } = await import('../server/middlewares/jsonContentTypeChecker.js');

const createMockReq = (headers = {}) => {
  const lowerCaseHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const contentType = lowerCaseHeaders['content-type'] ?? '';

  return {
    get: (name) => lowerCaseHeaders[name.toLowerCase()],
    is: (type) => (contentType.split(';')[0].trim() === type ? type : false),
  };
};

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkJsonContentType', () => {
  const middleware = checkJsonContentType();

  it('lets requests without a body through', () => {
    const next = jest.fn();

    middleware(createMockReq(), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('treats Content-Length 0 as no body', () => {
    const next = jest.fn();

    middleware(createMockReq({ 'Content-Length': '0', 'Content-Type': 'text/plain' }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('accepts JSON bodies', () => {
    const next = jest.fn();

    middleware(createMockReq({ 'Content-Length': '12', 'Content-Type': 'application/json; charset=utf-8' }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it.each([
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=x',
    'text/plain',
  ])('rejects %s bodies with 415', (contentType) => {
    const next = jest.fn();
    const res = createMockRes();

    middleware(createMockReq({ 'Content-Length': '12', 'Content-Type': contentType }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(415);
  });

  it('rejects chunked bodies without a JSON content type', () => {
    const res = createMockRes();

    middleware(createMockReq({ 'Transfer-Encoding': 'chunked' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(415);
  });
});
