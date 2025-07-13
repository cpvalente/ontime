import { PropsWithChildren, ReactNode } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { isOntimeBlock, TimerType } from 'ontime-types';
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
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import { formatedTime, getOffsetText } from '../overviewUtils';

import { TimeColumn, TimeRow } from './TimeLayout';

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
  const entry = useEntry(currentBlockId);

  const timeInBlock = formatedTime(blockStartedAt ? clock - blockStartedAt : null, 3, TimerType.CountUp);
  const blockExpectedEndString = formatedTime(blockExpectedEnd, 3, TimerType.CountUp);

  const remainingBlockDuration = (() => {
    if (blockStartedAt === null || !entry) return timerPlaceholder;
    if (!isOntimeBlock(entry)) return timerPlaceholder;
    return formatedTime(blockStartedAt + entry.duration - clock, 3, TimerType.CountDown);
  })();

  const timeUntilBlockEnd = (() => {
    if (blockExpectedEnd === null) return timerPlaceholder;
    return formatedTime(blockExpectedEnd - clock, 3, TimerType.CountDown);
  })()  ;

  return (
    <>
      <div>
        <Tooltip text='How long the group has been active'>
          <TimeRow
            label='Elapsed in group'
            value={timeInBlock}
            className={style.clock}
            muted={blockStartedAt === null}
          />
        </Tooltip>
        <Tooltip text='Remaining time until the planed group duration is up'>
          <TimeRow
            label='Remaining group duration'
            value={remainingBlockDuration}
            className={style.clock}
            muted={blockStartedAt === null}
          />
        </Tooltip>
      </div>
      <div>
        <Tooltip text='Expected time until the group can end, if everything ends on time from now on'>
          <TimeRow
            label='Expected time until group end'
            value={timeUntilBlockEnd}
            className={style.end}
            muted={blockStartedAt === null}
          />
        </Tooltip>
        <Tooltip text='Expected time the group will end, if everything ends on time from now on'>
          <TimeRow
            label='Expected group end'
            value={blockExpectedEndString}
            className={style.end}
            muted={blockStartedAt === null}
          />
        </Tooltip>
      </div>
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
