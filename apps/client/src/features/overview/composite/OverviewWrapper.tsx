import { PropsWithChildren, ReactNode, useState } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { isOntimeBlock } from 'ontime-types';
import { isPlaybackActive, millisToString } from 'ontime-utils';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import {
  useClock,
  useCurrentBlockId,
  useIsOnline,
  useRuntimePlaybackOverview,
  useTimer,
} from '../../../common/hooks/useSocket';
import useProjectData from '../../../common/hooks-query/useProjectData';
import { useEntry } from '../../../common/hooks-query/useRundown';
import { cx, enDash, timerPlaceholder, timerPlaceholderMin } from '../../../common/utils/styleUtils';
import { formatedTime, getOffsetText } from '../overviewUtils';

import { TimeColumn } from './TimeLayout';

import style from '../Overview.module.scss';

interface OverviewWrapperProps {
  navElements: ReactNode;
}

export function OverviewWrapper({ navElements, children }: PropsWithChildren<OverviewWrapperProps>) {
  const { isOnline } = useIsOnline();
  return (
    <div className={cx([style.overview, !isOnline && style.isOffline])}>
      <ErrorBoundary>
        <div className={style.nav}>{navElements}</div>
        <div className={style.info}>{children}</div>
      </ErrorBoundary>
    </div>
  );
}

export function TitlesOverview() {
  const { data } = useProjectData();

  if (!data.title && !data.description) {
    return null;
  }

  return (
    <div>
      <div className={style.title}>{data.title}</div>
      <div className={style.description}>{data.description}</div>
    </div>
  );
}

export function CurrentBlockOverview() {
  const { blockStartedAt, clock, blockExpectedEnd } = useRuntimePlaybackOverview();
  const { currentBlockId } = useCurrentBlockId();
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const entry = useEntry(currentBlockId);

  const timeInBlock = formatedTime(blockStartedAt ? clock - blockStartedAt : null, 2);

  /**
   * The time to the end of the block
   * as scheduled
   * TODO(v4): this needs to be calculated according to offset mode
   */
  const remainingBlockDuration = (() => {
    if (blockStartedAt === null || !entry) return timerPlaceholderMin;
    if (!isOntimeBlock(entry)) return timerPlaceholderMin;
    return formatedTime(blockStartedAt + entry.duration - clock, 2);
  })();

  /**
   * The time to the end of the block
   * as projected accounting for offset
   * TODO(v4): this needs to be calculated according to offset mode
   */
  const projectedBlockEnd = (() => {
    if (blockExpectedEnd === null) return timerPlaceholderMin;
    return formatedTime(blockExpectedEnd - clock, 2);
  })();

  return (
    <>
      {direction === 'up' && (
        <Tooltip text='How long the group has been active (click to change)'>
          <TimeColumn
            label='Elapsed in group'
            value={timeInBlock}
            className={style.clock}
            muted={blockStartedAt === null}
            onClick={() => setDirection('down')}
          />
        </Tooltip>
      )}
      {direction === 'down' && (
        <Tooltip text='Remaining time until the planed group duration is up (click to change)'>
          <TimeColumn
            label='Planned group end'
            value={remainingBlockDuration}
            className={style.clock}
            muted={blockStartedAt === null}
            onClick={() => setDirection('up')}
          />
        </Tooltip>
      )}

      <Tooltip text='Expected time until the group can end, if everything ends on time from now on (click to change)'>
        <TimeColumn
          label='Expected group end'
          value={projectedBlockEnd}
          className={style.end}
          muted={blockStartedAt === null}
        />
      </Tooltip>
    </>
  );
}

export function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current, { fallback: timerPlaceholder });

  return <TimeColumn label='Running timer' value={display} muted={current === null} />;
}

export function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const progressText = numEvents ? `${current} of ${numEvents || enDash}` : enDash;

  return <TimeColumn label='Progress' value={progressText} />;
}

export function RuntimeOverview() {
  const { offset, playback } = useRuntimePlaybackOverview();

  const isPlaying = isPlaybackActive(playback);
  const offsetText = getOffsetText(isPlaying ? offset : null);
  const offsetClasses = cx([style.offset, isPlaying && (offset < 0 ? style.behind : style.ahead)]);

  return <TimeColumn label='Offset' value={offsetText} className={offsetClasses} testId='offset' />;
}

export function ClockOverview() {
  const { clock } = useClock();

  return <TimeColumn label='Time now' value={formatedTime(clock)} />;
}
