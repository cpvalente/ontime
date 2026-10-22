import { Playback } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { getLoadedEventLabel } from '../operator.utils';

describe('getLoadedEventLabel()', () => {
  it.each([
    [Playback.Play, 'LIVE'],
    [Playback.Roll, 'LIVE'],
    [Playback.Pause, 'PAUSED'],
    [Playback.Armed, 'ARMED'],
  ])('labels a loaded event in %s as %s', (playback, label) => {
    expect(getLoadedEventLabel(playback)).toBe(label);
  });
});
