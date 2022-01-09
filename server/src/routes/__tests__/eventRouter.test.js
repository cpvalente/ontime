import { server, shutdown, startServer } from '../../app.js';
import supertest from 'supertest';

beforeAll(() => startServer());
afterAll(() => shutdown());

describe('When a GET request request is sent', () => {
  test('GET /event returns a valid object', async () => {
    await supertest(server)
      .get('/event')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.title).toBe('string');
        expect(typeof response.body.url).toBe('string');
        expect(typeof response.body.publicInfo).toBe('string');
        expect(typeof response.body.backstageInfo).toBe('string');
        expect(typeof response.body.endMessage).toBe('string');
      });
  });
});
