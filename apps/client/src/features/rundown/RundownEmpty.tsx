import { IoAdd } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';

import Empty from '../../common/components/state/Empty';

import style from './Empty.module.scss';

interface RundownEmptyProps {
  handleAddNew: () => void;
}

export default function RundownEmpty(props: RundownEmptyProps) {
  const { handleAddNew } = props;

  return (
    <div className={style.empty}>
      <Empty style={{ marginTop: '7vh', marginBottom: '1.5rem' }} />
      <Button onClick={handleAddNew} variant='ontime-filled' leftIcon={<IoAdd />}>
        Create Event
      </Button>
    </div>
  );
}
