import { IoAdd } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';

import style from './Empty.module.scss';

interface BlockEmptyProps {
  handleAddNew: () => void;
}

export default function BlockEmpty(props: BlockEmptyProps) {
  const { handleAddNew } = props;

  return (
    <div className={style.empty}>
      <Button size='sm' onClick={handleAddNew} variant='ontime-filled' leftIcon={<IoAdd />}>
        Create Event
      </Button>
    </div>
  );
}
