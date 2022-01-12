import { server, shutdown, startServer } from '../../app.js';
import supertest from 'supertest';

beforeAll(() => startServer());
afterAll(() => shutdown());

describe('When a GET request request is sent', () => {
  test('GET /ontime/poll returns a valid object', async () => {
    await supertest(server)
      .get('/ontime/poll')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.clock).toBe('number');
        expect(typeof response.body.running).toBe('number');
        expect(typeof response.body.timer).toBe('string');
        expect(typeof response.body.playback).toBe('string');
        expect(typeof response.body.title).toBe('string');
        expect(typeof response.body.presenter).toBe('string');
      });
  });

  test('GET /ontime/db returns a JSON object', async () => {
    await supertest(server)
      .get('/ontime/db')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(response.headers['content-type']).toContain('json');
      });
  });

  test('GET /ontime/info returns a valid object', async () => {
    await supertest(server)
      .get('/ontime/info')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.networkInterfaces).toBe('object');
        expect(typeof response.body.version).toBe('number');
        expect(typeof response.body.serverPort).toBe('number');
        expect(typeof response.body.osc).toBe('object');
      });
  });

  test('GET /ontime/aliases returns a valid object', async () => {
    await supertest(server)
      .get('/ontime/aliases')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      });
  });

  test('GET /ontime/settings returns a valid object', async () => {
    await supertest(server)
      .get('/ontime/settings')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.version).toBe('number');
        expect(typeof response.body.serverPort).toBe('number');
        expect(typeof response.body.pinCode).toBeDefined();
      });
  });

  test('GET /ontime/osc returns a valid object', async () => {
    await supertest(server)
      .get('/ontime/osc')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.port).toBe('number');
        expect(typeof response.body.portOut).toBe('number');
        expect(typeof response.body.targetIP).toBe('string');
        expect(typeof response.body.enabled).toBe('boolean');
      });
  });
});

describe('Any other returns the app', () => {
  test('GET / returns ontime app', async () => {
    await supertest(server)
      .get('/')
      .expect(200)
      .then((response) => {
        expect(response.body).toBeDefined();
        expect(response.text.includes('<!doctype html>')).toBe(true);
      });
  });
});
