import { OntimeEvent, Playback, TimerPhase } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { enDash } from '../../../common/utils/styleUtils';
import { getCardData, getIsPendingStart } from '../backstage.utils';

const now = { title: 'Keynote', note: 'Lapel mic' } as OntimeEvent;
const next = { title: 'Panel', note: 'Four chairs' } as OntimeEvent;

describe('getCardData()', () => {
  it('shows the now and next events with the chosen sources', () => {
    expect(getCardData(now, next, 'title', 'note', Playback.Play)).toStrictEqual({
      showNow: true,
      nowMain: 'Keynote',
      nowSecondary: 'Lapel mic',
      showNext: true,
      nextMain: 'Panel',
      nextSecondary: 'Four chairs',
    });
  });

  it('hides both cards when playback is stopped', () => {
    expect(getCardData(now, next, 'title', 'note', Playback.Stop)).toMatchObject({ showNow: false, showNext: false });
  });

  it('hides the next card after the last event', () => {
    expect(getCardData(now, null, null, null, Playback.Play)).toMatchObject({ showNow: true, showNext: false });
  });

  it('shows a dash for an untitled event', () => {
    const untitled = { title: '' } as OntimeEvent;
    expect(getCardData(untitled, null, null, null, Playback.Play).nowMain).toBe(enDash);
  });
});

describe('getIsPendingStart()', () => {
  it('is pending only while roll mode waits for the first scheduled start', () => {
    expect(getIsPendingStart(Playback.Roll, TimerPhase.Pending)).toBe(true);
    expect(getIsPendingStart(Playback.Roll, TimerPhase.Default)).toBe(false);
    expect(getIsPendingStart(Playback.Play, TimerPhase.Pending)).toBe(false);
  });
});
