import { IoAdd } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';
import { SupportedEntry } from 'ontime-types';

import Empty from '../../common/components/state/Empty';

import style from './Empty.module.scss';

interface RundownEmptyProps {
  handleAddNew: (type: SupportedEntry) => void;
}

export default function RundownEmpty(props: RundownEmptyProps) {
  const { handleAddNew } = props;

  return (
    <div className={style.empty}>
      <Empty style={{ marginTop: '5vh', marginBottom: '3rem' }} />
      <div className={style.inline}>
        <Button onClick={() => handleAddNew(SupportedEntry.Event)} variant='ontime-filled' leftIcon={<IoAdd />}>
          Create Event
        </Button>

        <Button onClick={() => handleAddNew(SupportedEntry.Block)} variant='ontime-filled' leftIcon={<IoAdd />}>
          Create Block
        </Button>
      </div>
    </div>
  );
}
