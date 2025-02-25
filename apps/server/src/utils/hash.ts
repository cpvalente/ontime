import { createHash } from 'node:crypto';

/**
 * Creates a hash of the password that is URL safe
 * @link https://stackoverflow.com/questions/17639645/websafe-encoding-of-hashed-string-in-nodejs
 */
export function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('base64url');
}
