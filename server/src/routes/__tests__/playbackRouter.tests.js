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

describe('When a POST state change is sent', () => {
  test('POST /playback/onAir returns 200', async () => {
    await supertest(server)
      .post('/playback/onAir')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/offAir returns 200', async () => {
    await supertest(server)
      .post('/playback/offAir')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/start returns 200', async () => {
    await supertest(server)
      .post('/playback/start')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/pause returns 200', async () => {
    await supertest(server)
      .post('/playback/pause')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/stop returns 200', async () => {
    await supertest(server)
      .post('/playback/stop')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/roll returns 200', async () => {
    await supertest(server)
      .post('/playback/roll')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/previous returns 200', async () => {
    await supertest(server)
      .post('/playback/previous')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/next returns 200', async () => {
    await supertest(server)
      .post('/playback/next')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/unload returns 200', async () => {
    await supertest(server)
      .post('/playback/unload')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
      });
  });

  test('POST /playback/reload returns 200', async () => {
    await supertest(server)
      .post('/playback/reload')
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

  test('POST of unknown request returns 404', async () => {
    await supertest(server).post('/playback/madeup').expect(404);
  });
});
