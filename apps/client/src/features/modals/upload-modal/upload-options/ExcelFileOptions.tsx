import { MutableRefObject } from 'react';
import { ExcelImportMap } from 'ontime-utils';

import ImportMapTable, { type TableEntry } from './ImportMapTable';

import style from '../UploadModal.module.scss';

interface ExcelFileOptionsProps {
  optionsRef: MutableRefObject<ExcelImportMap>;
  updateOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => void;
}

export default function ExcelFileOptions(props: ExcelFileOptionsProps) {
  const { optionsRef, updateOptions } = props;

  const worksheet: TableEntry[] = [{ label: 'Worksheet', title: 'worksheet', value: optionsRef.current.worksheet }];

  const timings: TableEntry[] = [
    { label: 'Start time', title: 'timeStart', value: optionsRef.current.timeStart },
    { label: 'End Time', title: 'timeEnd', value: optionsRef.current.timeEnd },
    { label: 'Duration', title: 'duration', value: optionsRef.current.duration },
  ];

  const titles: TableEntry[] = [
    { label: 'Cue', title: 'cue', value: optionsRef.current.cue },
    { label: 'Colour', title: 'colour', value: optionsRef.current.colour },
    { label: 'Title', title: 'title', value: optionsRef.current.title },
    { label: 'Presenter', title: 'presenter', value: optionsRef.current.presenter },
    { label: 'Subtitle', title: 'subtitle', value: optionsRef.current.subtitle },
    { label: 'Note', title: 'note', value: optionsRef.current.note },
  ];

  const options: TableEntry[] = [
    { label: 'Is Public', title: 'isPublic', value: optionsRef.current.isPublic },
    { label: 'Skip', title: 'skip', value: optionsRef.current.skip },
    { label: 'Timer Type', title: 'timerType', value: optionsRef.current.timerType },
    { label: 'End Action', title: 'endAction', value: optionsRef.current.endAction },
  ];

  const userFields: TableEntry[] = [
    { label: 'User 0', title: 'user0', value: optionsRef.current.user0 },
    { label: 'User 1', title: 'user1', value: optionsRef.current.user1 },
    { label: 'User 2', title: 'user2', value: optionsRef.current.user2 },
    { label: 'User 3', title: 'user3', value: optionsRef.current.user3 },
    { label: 'User 4', title: 'user4', value: optionsRef.current.user4 },
    { label: 'User 5', title: 'user5', value: optionsRef.current.user5 },
    { label: 'User 6', title: 'user6', value: optionsRef.current.user6 },
    { label: 'User 7', title: 'user7', value: optionsRef.current.user7 },
    { label: 'User 8', title: 'user8', value: optionsRef.current.user8 },
    { label: 'User 9', title: 'user9', value: optionsRef.current.user9 },
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
