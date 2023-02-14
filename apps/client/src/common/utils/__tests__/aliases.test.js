import { validateAlias } from '../aliases';

describe('An alias fails if incorrect', () => {
  const testsToFail = [
    // no empty
    '',
    // no https, http or www
    'https://www.test.com',
    'http://www.test.com',
    'www.test.com',
    // no hostname
    'localhost/test',
    '127.0.0.1/test',
    '0.0.0.0/test',
    // no editor
    'editor',
    'editor?test',
  ];

  testsToFail.forEach((t) =>
    it(`${t}`, () => {
      expect(validateAlias(t).status).toBeFalsy();
    }),
  );
});
