import { memo } from 'react';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPlayOutline } from '@react-icons/all-files/io5/IoPlayOutline';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';

import TooltipActionBtn from '../../../../common/components/buttons/TooltipActionBtn';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { setEventPlayback } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';

import style from '../EventBlock.module.scss';

const blockBtnStyle = {
  size: 'sm',
};

const tooltipProps = {
  openDelay: tooltipDelayMid,
};

interface EventBlockPlaybackProps {
  eventId: string;
  skip: boolean;
  isPlaying: boolean;
  selected: boolean;
}

const EventBlockPlayback = (props: EventBlockPlaybackProps) => {
  const { eventId, skip, isPlaying, selected } = props;
  const { updateEvent } = useEventAction();

  const toggleSkip = () => {
    updateEvent({ id: eventId, skip: !skip });
  };

  return (
    <div className={style.playbackActions}>
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Skip event'
        tooltip='Skip event'
        icon={skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
        backgroundColor={skip ? '#FA5656' : undefined}
        _hover={{ backgroundColor: skip ? '#FF7878' : '#404040' }}
        {...tooltipProps}
        {...blockBtnStyle}
        clickHandler={toggleSkip}
        tabIndex={-1}
        isDisabled={selected}
      />
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Load event'
        tooltip='Load event'
        icon={<IoReload className={style.flip} />}
        isDisabled={skip}
        {...tooltipProps}
        {...blockBtnStyle}
        clickHandler={() => setEventPlayback.loadEvent(eventId)}
        tabIndex={-1}
      />
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Start event'
        tooltip='Start event'
        icon={isPlaying ? <IoPlay /> : <IoPlayOutline />}
        isDisabled={skip}
        {...tooltipProps}
        {...blockBtnStyle}
        clickHandler={() => setEventPlayback.startEvent(eventId)}
        backgroundColor={isPlaying ? '#58A151' : undefined}
        _hover={{ backgroundColor: isPlaying ? '#58A151' : undefined }}
        tabIndex={-1}
      />
    </div>
  );
};

export default memo(EventBlockPlayback);
