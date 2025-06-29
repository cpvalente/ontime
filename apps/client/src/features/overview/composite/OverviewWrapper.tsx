import { PropsWithChildren, ReactNode } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { useIsOnline, useRuntimePlaybackOverview, useTimer } from '../../../common/hooks/useSocket';
import useProjectData from '../../../common/hooks-query/useProjectData';
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
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
  const { blockStartedAt: blockStartAt, clock } = useRuntimePlaybackOverview();

  const timeInBlock = formatedTime(blockStartAt ? clock - blockStartAt : null);

  return <TimeColumn label='Time in block' value={timeInBlock} className={style.clock} muted={blockStartAt === null} />;
}

export function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current, { fallback: timerPlaceholder });

  return <TimeColumn label='Running timer' value={display} muted={current === null} />;
}

export function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const ofTotal = numEvents || enDash;
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';

  return <TimeColumn label='Progress' value={progressText} />;
}

export function RuntimeOverview() {
  const { clock, offset, playback } = useRuntimePlaybackOverview();

  const offsetText = getOffsetText(offset);
  const offsetClasses = cx([style.offset, playback !== Playback.Stop && (offset < 0 ? style.behind : style.ahead)]);

  return (
    <>
      <TimeColumn label='Offset' value={offsetText} className={offsetClasses} testId='offset' />
      <TimeColumn label='Time now' value={formatedTime(clock)} />
    </>
  );
}
