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

describe('When a POST request is sent', () => {
  test('POST /event should return a 201', async () => {
    await supertest(server)
      .post('/events')
      .send(testEvent)
      .expect(201)
  });
});

describe('When a GET request request is sent', () => {
  test('GET /events returns a valid object', async () => {
    await supertest(server)
      .get('/events')
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      });
  });
  test('GET /events/:eventId returns a valid object', async () => {
    await supertest(server)
      .get(`/events/${testEvent.id}`)
      .expect(200)
      .then((response) => {
        expect(response.text.includes('<!doctype html>')).toBe(false);
        expect(response.body).toBeDefined();
        expect(response.body.title).toBe(testEvent.title);
        expect(response.body.subtitle).toBe(testEvent.subtitle);
        expect(response.body.presenter).toBe(testEvent.presenter);
        expect(response.body.note).toBe(testEvent.note);
        expect(response.body.timeStart).toBe(testEvent.timeStart);
        expect(response.body.timeEnd).toBe(testEvent.timeEnd);
        expect(response.body.isPublic).toBe(testEvent.isPublic);
        expect(response.body.type).toBe(testEvent.type);
        expect(response.body.id).toBe(testEvent.id);
      });
  });
});
