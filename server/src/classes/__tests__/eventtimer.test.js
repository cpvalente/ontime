import { EventTimer } from '../EventTimer';
import http from 'http';
import express from 'express';

// Create server
const app = express();
const server = http.createServer(app);

// necessary config
const timerConfig = { refresh: 1000 };

afterAll(async () => {
  await server.close();
});

test('object instantiates correctly', async () => {
  const t = new EventTimer(server, timerConfig);

  // it contains everything from Timer
  expect(t.clock).toBeNull();
  expect(t.duration).toBeNull();
  expect(t.current).toBeNull();
  expect(t.timeTag).toBeNull();
  expect(t.secondaryTimer).toBeNull();
  expect(t._secondaryTarget).toBeNull();
  expect(t._finishAt).toBeNull();
  expect(t._finishedAt).toBeNull();
  expect(t._finishedFlag).toBeFalsy();
  expect(t._startedAt).toBeNull();
  expect(t._pausedAt).toBeNull();
  expect(t._pausedInterval).toBeNull();
  expect(t._pausedTotal).toBeNull();
  expect(t.state).toBe('stop');

  // and its own properties
  expect(t.ontimeCycle).toBe('idle');
  expect(t.prevCycle).toBeNull();
  expect(t.io).not.toBeNull();
  expect(t.osc).toBeNull();
  expect(t.http).toBeNull();
  expect(t._numClients).toBe(0);
  expect(t._interval).not.toBeNull();
  expect(t.presenter).toStrictEqual({ text: '', visible: false });
  expect(t.public).toStrictEqual({ text: '', visible: false });
  expect(t.lower).toStrictEqual({ text: '', visible: false });
  expect(t.lower).toStrictEqual({ text: '', visible: false });

  const expectTitlesPublic = {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
  };

  const expectTitles = {
    ...expectTitlesPublic,
    noteNow: null,
    noteNext: null,
  };

  expect(t.titlesPublic).toStrictEqual(expectTitlesPublic);
  expect(t.titles).toStrictEqual(expectTitles);

  expect(t.selectedEventIndex).toBeNull();
  expect(t.selectedEventId).toBeNull();
  expect(t.nextEventId).toBeNull();
  expect(t.selectedPublicEventId).toBeNull();
  expect(t.nextPublicEventId).toBeNull();
  expect(t.numEvents).toBe(0);
  expect(t._eventlist).toBeNull();
  expect(t.onAir).toBeFalsy();

  t.shutdown();
});

describe('test triggers behaviour', () => {
  const t = new EventTimer(server, timerConfig);

  test('ignores bad commands', async(done) => {
    const success = t.trigger('test');
    expect(success).toBeFalsy();
    done();
  });

  test('does not allow triggering events with an empty list', async(done) => {
    expect(t.numEvents).toBe(0);

    expect(t.trigger('start')).toBeFalsy();
    expect(t.trigger('pause')).toBeFalsy();
    expect(t.trigger('stop')).toBeFalsy();
    expect(t.trigger('roll')).toBeFalsy();
    expect(t.trigger('previous')).toBeFalsy();
    expect(t.trigger('next')).toBeFalsy();
    expect(t.trigger('reload')).toBeFalsy();

    expect(t.onAir).toBeFalsy();
    expect(t.trigger('onAir')).toBeTruthy();
    expect(t.onAir).toBeTruthy();
    expect(t.trigger('offAir')).toBeTruthy();
    expect(t.onAir).toBeFalsy();
    done();
  });

  test('...and is consistent by calling the class methods', async (done) => {
    expect(t.numEvents).toBe(0);
    expect(t.state).toBe('stop');

    t.start();
    expect(t.state).toBe('stop');

    t.pause();
    expect(t.state).toBe('stop');

    t.stop();
    expect(t.state).toBe('stop');

    t.roll();
    expect(t.state).toBe('stop');

    t.previous();
    expect(t.state).toBe('stop');

    t.next();
    expect(t.state).toBe('stop');

    t.reload();
    expect(t.state).toBe('stop');
    done();
  });

  t.shutdown();
});
