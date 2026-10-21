import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logWarn: jest.fn(),
}));

//* Operators may list anything in the env allowlist - active content must
//* still never make it through
process.env.S3_ALLOWED_MIME_TYPES = 'image/png, text/html,image/svg+xml,application/xml ,text/xml,application/xhtml+xml,application/pdf';

const {
  isBlockedMimeType,
  MAX_PENDING_UPLOADS_PER_COMPANY,
  S3_ALLOWED_MIME_TYPES,
} = await import('../server/config/s3.js');

describe('S3_ALLOWED_MIME_TYPES', () => {
  it('strips HTML, SVG and XML families from an env-provided allowlist', () => {
    expect(S3_ALLOWED_MIME_TYPES).toEqual(['image/png', 'application/pdf']);
  });

  it('flags active-content MIME types regardless of case', () => {
    expect(isBlockedMimeType('TEXT/HTML')).toBe(true);
    expect(isBlockedMimeType('image/svg+xml')).toBe(true);
    expect(isBlockedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    expect(isBlockedMimeType('application/pdf')).toBe(false);
    expect(isBlockedMimeType('image/png')).toBe(false);
  });

  it('caps the unconfirmed uploads per company', () => {
    expect(MAX_PENDING_UPLOADS_PER_COMPANY).toBe(20);
  });
});
