import { IoAdd } from 'react-icons/io5';

import Empty from '../../common/components/state/Empty';
import { Button } from '../../common/components/ui/button';

import style from './Rundown.module.scss';

interface RundownEmptyProps {
  handleAddNew: () => void;
}

export default function RundownEmpty(props: RundownEmptyProps) {
  const { handleAddNew } = props;

  return (
    <div className={style.alignCenter}>
      <Empty style={{ marginTop: '7vh' }} />
      <Button onClick={handleAddNew} variant='ontime-filled' className={style.spaceTop}>
        <IoAdd /> Create Event
      </Button>
    </div>
  );
}
