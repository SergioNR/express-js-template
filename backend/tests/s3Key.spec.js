const { buildFileS3Key, sanitizeFilename } = await import('../server/utils/s3Key.js');

describe('sanitizeFilename', () => {
  it('keeps an already safe filename untouched', () => {
    expect(sanitizeFilename('report-2026_v2.pdf')).toBe('report-2026_v2.pdf');
  });

  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeFilename('my report (final).pdf')).toBe('my_report_(final).pdf');
    expect(sanitizeFilename('caf\u00e9 norte.csv')).toBe('cafe_norte.csv'); //* NFKD turns é into e + combining mark; the mark is dropped
  });

  it('strips path separators so a client cannot shape the key', () => {
    const sanitized = sanitizeFilename('../../etc/passwd');

    expect(sanitized).not.toContain('/');
    expect(sanitized).not.toContain('..');
  });

  it('removes leading and trailing dots, dashes and underscores', () => {
    expect(sanitizeFilename('.hidden-file.pdf')).toBe('hidden-file.pdf');
    expect(sanitizeFilename('...')).toBe('file');
    expect(sanitizeFilename('-_.pdf')).toBe('pdf');
  });

  it('falls back to "file" when nothing safe remains', () => {
    expect(sanitizeFilename('???')).toBe('file');
    expect(sanitizeFilename('   ')).toBe('file');
  });

  it('caps extremely long filenames', () => {
    const longName = `${'a'.repeat(400)}.pdf`;
    const sanitized = sanitizeFilename(longName);

    expect(sanitized.length).toBeLessThanOrEqual(150);
  });
});

describe('buildFileS3Key', () => {
  it('derives companyId/fileId/sanitized-filename keys', () => {
    expect(buildFileS3Key('company-1', 'file-1', 'report.pdf')).toBe('company-1/file-1/report.pdf');
  });

  it('never lets the client filename escape its prefix', () => {
    const key = buildFileS3Key('company-1', 'file-1', '../../../other-company/secret.pdf');

    expect(key.startsWith('company-1/file-1/')).toBe(true);
    expect(key).not.toContain('../');
  });
});
