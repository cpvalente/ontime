import { MouseEvent, memo } from 'react';
import { IoPause, IoPlay, IoReload, IoRemoveCircle, IoRemoveCircleOutline } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { setEventPlayback } from '../../../../common/hooks/useSocket';

import style from '../RundownEvent.module.scss';

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
  const { updateEntry } = useEntryActionsContext();

  const toggleSkip = (event: MouseEvent) => {
    event.stopPropagation();
    updateEntry({ id: eventId, skip: !skip });
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

  const playButtonStyles: { tooltip: string; backgroundColor: string | undefined } = (() => {
    if (isPaused) {
      return {
        tooltip: 'Continue event',
        backgroundColor: '#339E4E',
      };
    }

    if (isPlaying) {
      return {
        tooltip: 'Pause event',
        backgroundColor: '#c05621',
      };
    }
    return {
      tooltip: 'Start event',
      backgroundColor: undefined,
    };
  })();

  return (
    <div className={style.playbackActions}>
      <Tooltip
        text='Skip event'
        render={<IconButton variant='subtle-white' />}
        onClick={toggleSkip}
        tabIndex={-1}
        disabled={loaded}
        style={{
          background: skip ? '#9A0000' : undefined,
        }}
        aria-label='Skip event'
      >
        {skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
      </Tooltip>

      <Tooltip
        text='Load event'
        render={<IconButton variant='subtle-white' />}
        onClick={load}
        tabIndex={-1}
        disabled={disablePlayback}
        aria-label='Load event'
      >
        <IoReload className={style.flip} />
      </Tooltip>

      <Tooltip
        text={playButtonStyles.tooltip}
        render={<IconButton variant='subtle-white' />}
        onClick={actionHandler}
        tabIndex={-1}
        disabled={disablePlayback}
        style={{
          backgroundColor: playButtonStyles.backgroundColor,
        }}
        aria-label={isPlaying ? 'Pause event' : 'Start event'}
      >
        {!isPlaying ? <IoPlay /> : <IoPause />}
      </Tooltip>
    </div>
  );
}
