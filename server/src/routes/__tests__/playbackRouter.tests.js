import { server, shutdown, startServer } from '../../app.js';
import supertest from 'supertest';

beforeAll(() => startServer());
afterAll(() => shutdown());

describe('When a GET request request is sent', () => {
  test('GET /playback returns a valid object', async () => {
    await supertest(server)
      .get('/playback')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body.playback).toBe('string');
        expect(response.body.playback).toBe('stop' || 'start' || 'pause' || 'roll');
      });
  });
});

describe('When a GET state change is sent', () => {
  test('GET /playback/onAir returns 200', async () => {
    await supertest(server)
      .get('/playback/onAir')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/offAir returns 200', async () => {
    await supertest(server)
      .get('/playback/offAir')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/start returns 200', async () => {
    await supertest(server)
      .get('/playback/start')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/play returns 200', async () => {
    await supertest(server)
      .get('/playback/play')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/pause returns 200', async () => {
    await supertest(server)
      .get('/playback/pause')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/stop returns 200', async () => {
    await supertest(server)
      .get('/playback/stop')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/roll returns 200', async () => {
    await supertest(server)
      .get('/playback/roll')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/previous returns 200', async () => {
    await supertest(server)
      .get('/playback/previous')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/next returns 200', async () => {
    await supertest(server)
      .get('/playback/next')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/unload returns 200', async () => {
    await supertest(server)
      .get('/playback/unload')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET /playback/reload returns 200', async () => {
    await supertest(server)
      .get('/playback/reload')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('GET of unknown request returns app', async () => {
    await supertest(server)
      .get('/playback/madeup')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(true);
      });
  });
});
