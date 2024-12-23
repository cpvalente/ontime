import type { ImportMap } from '../spreadsheetImport';
import { isImportMap } from '../spreadsheetImport';

describe('isImportMap()', () => {
  it('validates a v3 default import map', () => {
    const v3ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    } as ImportMap;

    expect(isImportMap(v3ImportMap)).toBe(true);
  });

  it('handles custom properties', () => {
    const v3ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {
        userDefined: 'userDefined',
        anotherOne: 'anotherOne',
      },
    } as ImportMap;

    expect(isImportMap(v3ImportMap)).toBe(true);
  });
});
