import { memo, MouseEvent } from 'react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';

import TooltipActionBtn from '../../../../common/components/buttons/TooltipActionBtn';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { setEventPlayback, useFrozen } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';

import style from '../EventBlock.module.scss';

const blockBtnStyle = {
  size: 'sm',
};

type StyleVariant = {
  'aria-label': string;
  tooltip: string;
  backgroundColor: string;
  _hover: { backgroundColor?: string };
};

const tooltipProps = {
  openDelay: tooltipDelayMid,
};

interface EventBlockPlaybackProps {
  eventId: string;
  skip: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  loaded: boolean;
  disablePlayback: boolean;
}

const EventBlockPlayback = (props: EventBlockPlaybackProps) => {
  const { eventId, skip, isPlaying, isPaused, loaded, disablePlayback } = props;
  const { updateEvent } = useEventAction();
  const { frozen } = useFrozen();

  const toggleSkip = (event: MouseEvent) => {
    event.stopPropagation();
    updateEvent({ id: eventId, skip: !skip });
  };

  const actionHandler = (event: MouseEvent) => {
    event.stopPropagation();
    // is playing -> pause
    // is paused -> continue
    // otherwise -> start
    if (isPlaying) {
      setEventPlayback.pause();
    } else if (isPaused) {
      setEventPlayback.start();
    } else {
      setEventPlayback.startEvent(eventId);
    }
  };

  const load = (event: MouseEvent) => {
    event.stopPropagation();
    setEventPlayback.loadEvent(eventId);
  };

  const buttonVariant: Partial<StyleVariant> = {};

  if (isPaused) {
    // continue
    buttonVariant['aria-label'] = 'Continue event';
    buttonVariant.tooltip = 'Continue event';
    buttonVariant.backgroundColor = '#339E4E';
    buttonVariant._hover = { backgroundColor: '#339E4Eee' };
  } else if (isPlaying) {
    // pause
    buttonVariant['aria-label'] = 'Pause event';
    buttonVariant.tooltip = 'Pause event';
    buttonVariant.backgroundColor = '#c05621';
    buttonVariant._hover = { backgroundColor: '#c05621ee' };
  } else {
    // start
    buttonVariant['aria-label'] = 'Start event';
    buttonVariant.tooltip = 'Start event';
    if (!disablePlayback) {
      buttonVariant._hover = { backgroundColor: '#339E4E' };
    }
  }

  return (
    <div className={style.playbackActions}>
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Skip event'
        tooltip='Skip event'
        icon={skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
        backgroundColor={skip ? '#B20000' : undefined}
        _hover={{ backgroundColor: '#FF7878' }}
        {...tooltipProps}
        {...blockBtnStyle}
        clickHandler={toggleSkip}
        tabIndex={-1}
        isDisabled={frozen || loaded}
      />
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Load event'
        tooltip='Load event'
        icon={<IoReload className={style.flip} />}
        isDisabled={disablePlayback}
        {...tooltipProps}
        {...blockBtnStyle}
        clickHandler={load}
        tabIndex={-1}
      />
      <TooltipActionBtn
        variant='ontime-subtle-white'
        aria-label='Start event'
        tooltip='Start event'
        icon={!isPlaying ? <IoPlay /> : <IoPause />}
        isDisabled={disablePlayback}
        {...tooltipProps}
        {...blockBtnStyle}
        {...buttonVariant}
        clickHandler={actionHandler}
        tabIndex={-1}
      />
    </div>
  );
};

export default memo(EventBlockPlayback);
