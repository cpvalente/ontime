import { memo, PropsWithChildren, ReactNode, useMemo } from 'react';
import { millisToString, removeLeadingZero } from 'ontime-utils';
import { Box } from '@chakra-ui/react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useIsOnline, useRuntimeOverview, useRuntimePlaybackOverview, useTimer } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useRuntimeStore } from '../../common/stores/runtime';
import { cx, enDash, timerPlaceholder } from '../../common/utils/styleUtils';

import { TimeColumn, TimeRow } from './composite/TimeLayout';
import { calculateEndAndDaySpan, formatedTime, getOffsetText } from './overviewUtils';

import style from './Overview.module.scss';

export const MobileEditorOverview = memo(_MobileEditorOverview);

function _MobileEditorOverview({ children }: PropsWithChildren) {
  const { plannedEnd, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <OverviewWrapper navElements={children}>
      <Box maxW="1100px" mx="auto" px={4} ml={-2} display="flex" alignItems="center" gap={8}>
        <TitlesOverview />
        <ProgressOverview />
        <RuntimeOverview />
        <div>
          <TimeRow
            label='Planned end'
            value={plannedEndText}
            className={style.end}
            daySpan={maybePlannedDaySpan}
            muted={maybePlannedEnd === null}
          />
          <TimeRow
            label='Expected end'
            value={expectedEndText}
            className={style.end}
            daySpan={maybeExpectedDaySpan}
            muted={maybeExpectedEnd === null}
          />
        </div>
        <QlabTimerOverview />
      </Box>
    </OverviewWrapper>
  );
}

export const MobileCuesheetOverview = memo(_MobileCuesheetOverview);

function _MobileCuesheetOverview({ children }: PropsWithChildren) {
  const { plannedEnd, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <OverviewWrapper navElements={children}>
      <TitlesOverview />
      <TimerOverview />
      <RuntimeOverview />
      <div>
        <TimeRow
          label='Planned end'
          value={plannedEndText}
          className={style.end}
          daySpan={maybePlannedDaySpan}
          muted={maybePlannedEnd === null}
        />
        <TimeRow
          label='Expected end'
          value={expectedEndText}
          className={style.end}
          daySpan={maybeExpectedDaySpan}
          muted={maybeExpectedEnd === null}
        />
      </div>
    </OverviewWrapper>
  );
}

interface OverviewWrapperProps {
  navElements: ReactNode;
}

function OverviewWrapper({ navElements, children }: PropsWithChildren<OverviewWrapperProps>) {
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

function TitlesOverview() {
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

function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current, { fallback: timerPlaceholder });

  return <TimeColumn label='Running timer' value={display} muted={current === null} />;
}

function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const ofTotal = numEvents || enDash;
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';

  return <TimeColumn label='Progress' value={progressText} />;
}

function RuntimeOverview() {
  const { clock, globalDelay } = useRuntimePlaybackOverview();

  const offsetText = getOffsetText(globalDelay);
  const offsetClasses = globalDelay === 0 ? undefined : globalDelay > 0 ? style.behind : style.ahead;

  return (
    <>
      <TimeColumn label='Delay' value={offsetText} className={offsetClasses} testId='offset' />
      <TimeColumn label='Time now' value={formatedTime(clock)} />
    </>
  );
}

function QlabTimerOverview() {
  const qlab = useRuntimeStore((state) => state.qlab);

  if (!qlab.enabled) return null;

  const display = removeLeadingZero(millisToString(qlab.remaining));
  return <TimeColumn label='Qlab timer' value={display} />;
}
