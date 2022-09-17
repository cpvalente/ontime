import { server, shutdown, startServer } from '../../app.js';
import supertest from 'supertest';

beforeAll(() => startServer());
afterAll(() => shutdown());

const testEvent = {
  title: 'API test event',
  subtitle: 'test title',
  presenter: 'test presenter',
  note: 'test note',
  timeStart: 0,
  timeEnd: 42,
  isPublic: false,
  type: 'event',
  id: 'superSpecial12',
};

const eventFromDb = {
  title: 'Welcome to Ontime',
  subtitle: 'Subtitles are useful',
  presenter: 'cpvalente',
  note: 'Maybe a running note for the operator?',
  timeStart: 28800000,
  timeEnd: 30600000,
  isPublic: false,
  type: 'event',
  revision: 7,
  id: '5946',
};

describe('When a POST request is sent', () => {
  test('POST /event should return a 201', async () => {
    await supertest(server).post('/events').send(testEvent).expect(201);
  });
});

describe('When a GET request request is sent', () => {
  test('GET /events returns a valid object', async () => {
    await supertest(server)
      .get('/events')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!DOCTYPE html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      });
  });
  test('GET /events/:eventId returns a valid object', async () => {
    await supertest(server)
      .get(`/events/${eventFromDb.id}`)
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!DOCTYPE html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(response.body.title).toBe(eventFromDb.title);
        expect(response.body.subtitle).toBe(eventFromDb.subtitle);
        expect(response.body.presenter).toBe(eventFromDb.presenter);
        expect(response.body.note).toBe(eventFromDb.note);
        expect(response.body.timeStart).toBe(eventFromDb.timeStart);
        expect(response.body.timeEnd).toBe(eventFromDb.timeEnd);
        expect(response.body.isPublic).toBe(eventFromDb.isPublic);
        expect(response.body.type).toBe(eventFromDb.type);
        expect(response.body.id).toBe(eventFromDb.id);
      });
  });
});
