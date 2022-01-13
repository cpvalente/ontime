import { Tooltip } from '@chakra-ui/tooltip';
import { Checkbox } from '@chakra-ui/react';
import style from './EntryBlock.module.scss';

export default function EntryBlock(props) {
  const { showKbd } = props;
  return (
    <div className={style.create}>
      <Tooltip label='Add Event' openDelay={300}>
        <span className={style.createEvent}>
          E{showKbd && <span className={style.keyboard}>Alt + E</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Delay' openDelay={300}>
        <span className={style.createDelay}>
          D{showKbd && <span className={style.keyboard}>Alt + D</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Block' openDelay={300}>
        <span className={style.createBlock}>
          B{showKbd && <span className={style.keyboard}>Alt + B</span>}
        </span>
      </Tooltip>
      <div className={style.options}>
        <Checkbox size='sm' colorScheme='white'>
          Start time is last end
        </Checkbox>
        <Checkbox size='sm' colorScheme='white'>
          Default private
        </Checkbox>
      </div>
    </div>
  );
}
