import { EndAction, Settings, TimeStrategy, TimerType } from 'ontime-types';
import { defaultPhaseThresholds, defaultRundownDefaults } from 'ontime-utils';

import { parseSettings } from '../settings.parser.js';

describe('parseSettings()', () => {
  it('throws if settings object does not exist', () => {
    expect(() => parseSettings({})).toThrow('ERROR: unable to parse settings, missing or incorrect version');
  });

  it('returns an a base model as long as we have the app version', () => {
    const result = parseSettings({ settings: { version: '1' } as Settings });
    expect(result).toBeTypeOf('object');
    expect(result).toMatchObject({
      version: expect.any(String),
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
      auxTimerNames: ['', '', ''],
      phaseThresholds: defaultPhaseThresholds,
      rundownDefaults: defaultRundownDefaults,
    });
  });

  it('carries custom aux timer names through and pads to a length-3 array', () => {
    const result = parseSettings({
      settings: { version: '1', auxTimerNames: ['Speaker'] } as unknown as Settings,
    });
    expect(result.auxTimerNames).toStrictEqual(['Speaker', '', '']);
  });

  it('keeps valid rundown defaults and falls back per field', () => {
    const result = parseSettings({
      settings: {
        version: '1',
        rundownDefaults: {
          duration: 300000,
          linkPrevious: false,
          timeStrategy: TimeStrategy.LockEnd,
          timerType: 'not-a-timer',
          endAction: EndAction.PlayNext,
          inheritGroupColour: 'yes',
        },
      } as unknown as Settings,
    });
    expect(result.rundownDefaults).toStrictEqual({
      duration: 300000,
      linkPrevious: false,
      timeStrategy: TimeStrategy.LockEnd,
      timerType: TimerType.CountDown,
      endAction: EndAction.PlayNext,
      inheritGroupColour: false,
    });
  });

  it.each([-1, '600000'])('falls back to the default duration for %j', (duration) => {
    const result = parseSettings({
      settings: { version: '1', rundownDefaults: { duration } } as unknown as Settings,
    });
    expect(result.rundownDefaults.duration).toBe(defaultRundownDefaults.duration);
  });
});
