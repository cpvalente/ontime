import { ViewSettings } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { getTimerColour } from '../presentation.utils';

describe('getTimerColour()', () => {
  const viewSettings = {
    normalColor: '#normal',
    warningColor: '#warning',
    dangerColor: '#danger',
  } as ViewSettings;

  it('uses the warning and danger colours as the event runs out of time', () => {
    expect(getTimerColour(viewSettings, undefined, true, false)).toBe('#warning');
    expect(getTimerColour(viewSettings, undefined, false, true)).toBe('#danger');
  });

  it('uses the colour from the view params over the project colour', () => {
    expect(getTimerColour(viewSettings, '#param', false, false)).toBe('#param');
    expect(getTimerColour(viewSettings, undefined, false, false)).toBe('#normal');
  });

  it('shows warning and danger even when the view params set a colour', () => {
    expect(getTimerColour(viewSettings, '#param', true, false)).toBe('#warning');
    expect(getTimerColour(viewSettings, '#param', false, true)).toBe('#danger');
  });
});
