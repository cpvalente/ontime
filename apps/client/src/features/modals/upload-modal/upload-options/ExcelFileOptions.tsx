import { MutableRefObject } from 'react';
import { Input } from '@chakra-ui/react';

import ModalSplitInput from '../../ModalSplitInput';

import ImportMapTable, { type TableEntry } from './ImportMapTable';
import { ExcelInputOptions } from '../UploadModal';

import style from '../UploadModal.module.scss';

interface ExcelFileOptionsProps {
  optionsRef: MutableRefObject<ExcelInputOptions>;
}

export default function ExcelFileOptions(props: ExcelFileOptionsProps) {
  const { optionsRef } = props;

  const updateRef = <T extends keyof ExcelInputOptions>(field: T, value: ExcelInputOptions[T]) => {
    // avoid unnecessary changes
    if (optionsRef.current[field] !== value) {
      optionsRef.current = { ...optionsRef.current, [field]: value };
    }
  };

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
      <div className={style.twoColumn}>
        <ImportMapTable title='Import options' fields={worksheet} handleOnChange={updateRef} />
      </div>

      <div className={style.twoColumn}>
        <ImportMapTable title='Timings' fields={timings} handleOnChange={updateRef} />
        <ImportMapTable title='Options' fields={options} handleOnChange={updateRef} />
      </div>

      <div className={style.twoColumn}>
        <ImportMapTable title='Titles' fields={titles} handleOnChange={updateRef} />
        <ImportMapTable title='User Fields' fields={userFields} handleOnChange={updateRef} />
      </div>
    </div>
  );
}
