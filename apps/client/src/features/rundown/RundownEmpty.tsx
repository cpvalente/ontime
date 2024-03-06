import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';

import Empty from '../../common/components/state/Empty';

import style from './Rundown.module.scss';

interface RundownEmptyProps {
  handleAddNew: () => void;
}

export default function RundownEmpty(props: RundownEmptyProps) {
  const { handleAddNew } = props;

  return (
    <div className={style.alignCenter}>
      <Empty style={{ marginTop: '7vh' }} />
      <Button onClick={handleAddNew} variant='ontime-filled' className={style.spaceTop} leftIcon={<IoAdd />}>
        Create Event
      </Button>
    </div>
  );
}
