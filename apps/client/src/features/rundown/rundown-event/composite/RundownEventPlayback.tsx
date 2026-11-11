import { MouseEvent, memo } from 'react';
import { IoPause, IoPlay, IoReload, IoRemoveCircle, IoRemoveCircleOutline } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { useRundownScope } from '../../../../common/context/RundownScopeContext';
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
  const { isLoaded: isRundownLoaded } = useRundownScope();
  // playback commands act on the loaded rundown, so they cannot start an entry of another rundown
  const playbackTooltip = isRundownLoaded ? undefined : 'Load the rundown to play its events';

  const toggleSkip = (event: MouseEvent) => {
    event.stopPropagation();
    updateEntry({ id: eventId, skip: !skip });
  };

  const actionHandler = (event: MouseEvent) => {
    event.stopPropagation();
    if (!isRundownLoaded) {
      return;
    }
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
    if (!isRundownLoaded) {
      return;
    }
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
        text={skip ? 'Include event' : 'Skip event'}
        render={<IconButton variant={skip ? 'subtle-destructive' : 'subtle-white'} />}
        onClick={toggleSkip}
        tabIndex={-1}
        disabled={loaded}
        aria-label={skip ? 'Include event' : 'Skip event'}
        aria-pressed={skip}
      >
        {skip ? <IoRemoveCircle /> : <IoRemoveCircleOutline />}
      </Tooltip>

      <Tooltip
        text={playbackTooltip ?? 'Load event'}
        render={<IconButton variant='subtle-white' />}
        onClick={load}
        tabIndex={-1}
        disabled={disablePlayback}
        aria-disabled={!isRundownLoaded}
        aria-label='Load event'
      >
        <IoReload className={style.flip} />
      </Tooltip>

      <Tooltip
        text={playbackTooltip ?? playButtonStyles.tooltip}
        render={<IconButton variant='subtle-white' />}
        onClick={actionHandler}
        tabIndex={-1}
        disabled={disablePlayback}
        aria-disabled={!isRundownLoaded}
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
