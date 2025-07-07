import { PropsWithChildren, ReactNode } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { isOntimeBlock } from 'ontime-types';
import { isPlaybackActive, millisToString } from 'ontime-utils';

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
  const { blockStartedAt: blockStartAt, clock } = useRuntimePlaybackOverview();
  const { currentBlockId } = useCurrentBlockId();
  const entry = useEntry(currentBlockId);

  const timeInBlock = formatedTime(blockStartAt ? clock - blockStartAt : null, 2);

  /**
   * The time to the end of the block
   * as scheduled
   * TODO(v4): this needs to be calculated according to offset mode
   */
  const blockEnd = (() => {
    if (!entry) return timerPlaceholderMin;
    if (!isOntimeBlock(entry)) return timerPlaceholderMin;
    if (entry.timeEnd === null) return timerPlaceholderMin;
    return formatedTime(entry.timeEnd - clock, 2);
  })();

  /**
   * The time to the end of the block
   * as projected accounting for delays and offset
   * TODO(v4): this needs to be calculated according to offset mode
   */
  const projectedBlockEnd = (() => {
    if (blockStartAt === null || !entry) return timerPlaceholderMin;
    if (!isOntimeBlock(entry)) return timerPlaceholderMin;
    return formatedTime(blockStartAt + entry.duration - clock, 2);
  })();

  return (
    <>
      <TimeColumn label='Elapsed in block' value={timeInBlock} className={style.clock} muted={blockStartAt === null} />
      <div>
        <TimeRow label='Block end' value={blockEnd} className={style.end} muted={blockStartAt === null} />
        <TimeRow
          label='Projected block end'
          value={projectedBlockEnd}
          className={style.end}
          muted={blockStartAt === null}
        />
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
