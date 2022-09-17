import { useEffect, useState } from 'react';
import { Checkbox } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/tooltip';
import { useAtomValue } from 'jotai';
import PropTypes from 'prop-types';

import {
  defaultPublicAtom,
  startTimeIsLastEndAtom,
} from '../../../common/atoms/LocalEventSettings';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './EntryBlock.module.scss';

export default function EntryBlock(props) {
  const {
    showKbd,
    previousId,
    eventsHandler,
    visible,
    disableAddDelay = true,
    disableAddBlock,
  } = props;
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const [doStartTime, setStartTime] = useState(startTimeIsLastEnd);
  const [doPublic, setPublic] = useState(defaultPublic);

  useEffect(() => {
    setStartTime(startTimeIsLastEnd);
  }, [startTimeIsLastEnd]);

  useEffect(() => {
    setPublic(defaultPublic);
  }, [defaultPublic]);

  return (
    <div className={`${style.create} ${visible ? style.visible : ''}`}>
      <Tooltip label='Add Event' openDelay={tooltipDelayMid}>
        <span
          className={style.createEvent}
          onClick={() =>
            eventsHandler(
              'add',
              { type: 'event', after: previousId, isPublic: doPublic },
              { startIsLastEnd: doStartTime ? previousId : undefined }
            )
          }
          role='button'
        >
          E{showKbd && <span className={style.keyboard}>Alt + E</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Delay' openDelay={tooltipDelayMid}>
        <span
          className={`${style.createDelay} ${disableAddDelay ? style.disabled : ''}`}
          onClick={() => eventsHandler('add', { type: 'delay', after: previousId })}
          role='button'
        >
          D{showKbd && <span className={style.keyboard}>Alt + D</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Block' openDelay={tooltipDelayMid}>
        <span
          className={`${style.createBlock} ${disableAddBlock ? style.disabled : ''}`}
          onClick={() => eventsHandler('add', { type: 'block', after: previousId })}
          role='button'
        >
          B{showKbd && <span className={style.keyboard}>Alt + B</span>}
        </span>
      </Tooltip>
      <div className={style.options}>
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doStartTime}
          onChange={(e) => {
            setStartTime(e.target.checked);
          }}
        >
          Start time is last end
        </Checkbox>
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doPublic}
          onChange={(e) => setPublic(e.target.checked)}
        >
          Event is public
        </Checkbox>
      </div>
    </div>
  );
}

EntryBlock.propTypes = {
  showKbd: PropTypes.bool,
  eventsHandler: PropTypes.func,
  visible: PropTypes.bool,
  previousId: PropTypes.string,
  disableAddDelay: PropTypes.bool,
  disableAddBlock: PropTypes.bool,
};
