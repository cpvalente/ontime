import { Tooltip } from '@chakra-ui/tooltip';
import { Checkbox } from '@chakra-ui/react';
import style from './EntryBlock.module.scss';
import { useContext, useEffect, useState } from 'react';
import { LocalEventSettingsContext } from '../../../app/context/LocalEventSettingsContext';

export default function EntryBlock(props) {
  const { showKbd } = props;
  const { starTimeIsLastEnd, defaultPrivate } = useContext(LocalEventSettingsContext);
  const [doStartTime, setStartTime] = useState(starTimeIsLastEnd);
  const [doPrivate, setPrivate] = useState(defaultPrivate);

  useEffect(() => {
    setStartTime(starTimeIsLastEnd);
  }, [starTimeIsLastEnd]);

  useEffect(() => {
    setPrivate(defaultPrivate);
  }, [defaultPrivate]);

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
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doStartTime}
          onChange={(e) => setStartTime(e.target.checked)}
        >
          Start time is last end
        </Checkbox>
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doPrivate}
          onChange={(e) => setPrivate(e.target.checked)}
        >
          Default private
        </Checkbox>
      </div>
    </div>
  );
}
