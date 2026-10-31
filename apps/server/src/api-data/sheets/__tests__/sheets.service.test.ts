import { InvalidSheetsClientSecretError } from '../sheets.errors.js';
import { handleClientSecret } from '../sheets.service.js';

it('rejects malformed credentials without exposing their contents', () => {
  expect(() => handleClientSecret('private invalid credentials')).toThrowError(new InvalidSheetsClientSecretError());
});
