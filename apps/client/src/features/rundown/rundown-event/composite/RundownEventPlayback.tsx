import { memo, MouseEvent, useCallback, useMemo } from 'react';
import { IoPause, IoPlay, IoReload, IoRemoveCircle, IoRemoveCircleOutline } from 'react-icons/io5';

import TooltipActionBtn from '../../../../common/components/buttons/TooltipActionBtn';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { setEventPlayback } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';

import style from '../RundownEvent.module.scss';

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

interface RundownEventPlaybackProps {
  eventId: string;
  skip: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  loaded: boolean;
  disablePlayback: boolean;
}

export default memo(RundownEventPlayback);
function RundownEventPlayback({
  eventId,
  skip,
  isPlaying,
  isPaused,
  loaded,
  disablePlayback,
}: RundownEventPlaybackProps) {
  const { updateEntry } = useEntryActions();

  const toggleSkip = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      updateEntry({ id: eventId, skip: !skip });
    },
    [eventId, skip, updateEntry],
  );

  const actionHandler = useCallback(
    (event: MouseEvent) => {
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
    },
    [isPlaying, isPaused, eventId],
  );

  const load = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setEventPlayback.loadEvent(eventId);
    },
    [eventId],
  );

  const buttonVariant: Partial<StyleVariant> = useMemo(() => {
    const variant: Partial<StyleVariant> = {};
    if (isPaused) {
      // continue
      variant['aria-label'] = 'Continue event';
      variant.tooltip = 'Continue event';
      variant.backgroundColor = '#339E4E';
      variant._hover = { backgroundColor: '#339E4Eee' };
    } else if (isPlaying) {
      // pause
      variant['aria-label'] = 'Pause event';
      variant.tooltip = 'Pause event';
      variant.backgroundColor = '#c05621';
      variant._hover = { backgroundColor: '#c05621ee' };
    } else {
      // start
      variant['aria-label'] = 'Start event';
      variant.tooltip = 'Start event';
      if (!disablePlayback) {
        variant._hover = { backgroundColor: '#339E4E' };
      }
    }
    return variant;
  }, [isPaused, isPlaying, disablePlayback]);

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
        isDisabled={loaded}
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
}
