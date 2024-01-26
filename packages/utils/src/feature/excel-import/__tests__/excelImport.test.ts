import { isExcelImportMap } from '../excelImport';

describe('isExcelImportMap', () => {
  test('migrate v2 map', () => {
    const v2ImportMap = {
      worksheet: 'event schedule',
      projectName: 'project name',
      projectDescription: 'project description',
      publicUrl: 'public url',
      publicInfo: 'public info',
      backstageUrl: 'backstage url',
      backstageInfo: 'backstage info',
      timeStart: 'time start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      presenter: 'presenter',
      subtitle: 'subtitle',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      user0: 'header',
      user1: 'user1',
      user2: 'user2',
      user3: 'user3',
      user4: 'user4',
      user5: 'user5',
      user6: 'user6',
      user7: 'user7',
      user8: 'user8',
      user9: 'user9',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
    };

    expect(isExcelImportMap(v2ImportMap)).toBe(true);
  });
});
