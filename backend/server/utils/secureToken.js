import { createHash, randomBytes } from 'node:crypto';

//* Emailed secrets (team invites, password resets) are random 256-bit tokens
//* that are never stored - only their sha256 digest is persisted, so a
//* database leak or an API response can never hand out a usable link.
//* sha256 (not bcrypt) is enough: the input already carries 256 bits of
//* entropy, and a deterministic digest allows a unique-index lookup.

const SECURE_TOKEN_BYTES = 32;

//* 32 bytes encode to exactly 43 base64url characters (no padding)
export const SECURE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const generateSecureToken = () => randomBytes(SECURE_TOKEN_BYTES).toString('base64url');

export const hashSecureToken = (token) => createHash('sha256').update(String(token)).digest('hex');
