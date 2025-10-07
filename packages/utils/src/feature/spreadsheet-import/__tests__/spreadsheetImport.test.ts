import type { ImportMap } from '../spreadsheetImport';
import { isImportMap } from '../spreadsheetImport';

describe('isImportMap()', () => {
  it('validates a v4 default import map', () => {
    const importMap: ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
      id: 'id',
    };

    expect(isImportMap(importMap)).toBe(true);
  });

  it('rejects map missing keys', () => {
    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };

    expect(isImportMap(importMap)).toBe(false);
  });

  it('handles custom properties', () => {
    const importMap: ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
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
      id: 'id',
    };

    expect(isImportMap(importMap)).toBe(true);
  });
});
