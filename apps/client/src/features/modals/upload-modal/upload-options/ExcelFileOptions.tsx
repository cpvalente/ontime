import { ExcelImportMap } from 'ontime-utils';

import ImportMapTable, { type TableEntry } from './ImportMapTable';

import style from '../UploadModal.module.scss';

interface ExcelFileOptionsProps {
  importOptions: ExcelImportMap;
  updateOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => void;
}

export default function ExcelFileOptions(props: ExcelFileOptionsProps) {
  const { importOptions, updateOptions } = props;

  const worksheet: TableEntry[] = [{ label: 'Worksheet', title: 'worksheet', value: importOptions.worksheet }];

  const timings: TableEntry[] = [
    { label: 'Start time', title: 'timeStart', value: importOptions.timeStart },
    { label: 'End Time', title: 'timeEnd', value: importOptions.timeEnd },
    { label: 'Duration', title: 'duration', value: importOptions.duration },
    { label: 'Warning Time', title: 'timeWarning', value: importOptions.timeWarning },
    { label: 'Danger Time', title: 'timeDanger', value: importOptions.timeDanger },
  ];

  const titles: TableEntry[] = [
    { label: 'Cue', title: 'cue', value: importOptions.cue },
    { label: 'Colour', title: 'colour', value: importOptions.colour },
    { label: 'Title', title: 'title', value: importOptions.title },
    { label: 'Presenter', title: 'presenter', value: importOptions.presenter },
    { label: 'Subtitle', title: 'subtitle', value: importOptions.subtitle },
    { label: 'Note', title: 'note', value: importOptions.note },
  ];

  const options: TableEntry[] = [
    { label: 'Is Public', title: 'isPublic', value: importOptions.isPublic },
    { label: 'Skip', title: 'skip', value: importOptions.skip },
    { label: 'Timer Type', title: 'timerType', value: importOptions.timerType },
    { label: 'End Action', title: 'endAction', value: importOptions.endAction },
  ];

  const userFields: TableEntry[] = [
    { label: 'User 0', title: 'user0', value: importOptions.user0 },
    { label: 'User 1', title: 'user1', value: importOptions.user1 },
    { label: 'User 2', title: 'user2', value: importOptions.user2 },
    { label: 'User 3', title: 'user3', value: importOptions.user3 },
    { label: 'User 4', title: 'user4', value: importOptions.user4 },
    { label: 'User 5', title: 'user5', value: importOptions.user5 },
    { label: 'User 6', title: 'user6', value: importOptions.user6 },
    { label: 'User 7', title: 'user7', value: importOptions.user7 },
    { label: 'User 8', title: 'user8', value: importOptions.user8 },
    { label: 'User 9', title: 'user9', value: importOptions.user9 },
  ];

  return (
    <div className={style.uploadOptions}>
      <div className={style.twoEqualColumn}>
        <ImportMapTable title='Sheet settings' fields={worksheet} handleOnChange={updateOptions} />
      </div>

      <div className={style.twoEqualColumn}>
        <ImportMapTable title='Timings' fields={timings} handleOnChange={updateOptions} />
        <ImportMapTable title='Options' fields={options} handleOnChange={updateOptions} />
      </div>

      <div className={style.twoEqualColumn}>
        <ImportMapTable title='Titles' fields={titles} handleOnChange={updateOptions} />
        <ImportMapTable title='User Fields' fields={userFields} handleOnChange={updateOptions} />
      </div>
    </div>
  );
}
