import {Timer} from "../Timer";

test('object instantiates correctly', () => {
  const t = new Timer();

  expect(t.clock).toBeNull;
  expect(t.duration).toBeNull;
  expect(t.current).toBeNull;
  expect(t.timeTag).toBeNull;
  expect(t.secondaryTimer).toBeNull;
  expect(t._secondaryTarget).toBeNull;
  expect(t._finishAt).toBeNull;
  expect(t._finishedAt).toBeNull;
  expect(t._finishedFlag).toBeFalsy;
  expect(t._startedAt).toBeNull;
  expect(t._pausedAt).toBeNull;
  expect(t._pausedInterval).toBeNull;
  expect(t._pausedTotal).toBeNull;
  expect(t.state).toBe('stop');
})