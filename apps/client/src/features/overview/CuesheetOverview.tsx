import { PropsWithChildren, memo } from 'react';

import { useDisplayTimezone } from '../../common/hooks/useDisplayTimezone';
import { useIsMobileScreen } from '../../common/hooks/useIsMobileScreen';
import TimezoneBadge from '../../views/common/timezone/TimezoneBadge';
import {
  ClockOverview,
  MetadataTimes,
  OffsetOverview,
  StartTimesRuntime,
  TimerOverview,
} from './composite/TimeElements';
import TitleOverview from './composite/TitleOverview';
import { OverviewWrapper } from './OverviewWrapper';

export default memo(CuesheetOverview);
function CuesheetOverview({ children }: PropsWithChildren) {
  const isMobileScreen = useIsMobileScreen();

  if (isMobileScreen) {
    return <CuesheetMobile>{children}</CuesheetMobile>;
  }
  return <CuesheetDesktop>{children}</CuesheetDesktop>;
}

function CuesheetMobile({ children }: PropsWithChildren) {
  const { timezoneDelta, displayZone } = useDisplayTimezone();

  return (
    <OverviewWrapper navElements={children}>
      <TimezoneBadge displayZone={displayZone} timezoneDelta={timezoneDelta} placement='inline' />
      <TimerOverview />
      <OffsetOverview />
    </OverviewWrapper>
  );
}

function CuesheetDesktop({ children }: PropsWithChildren) {
  const { timezoneDelta, displayZone } = useDisplayTimezone();

  return (
    <OverviewWrapper navElements={children}>
      <TitleOverview />
      <StartTimesRuntime shouldFormat timezoneDelta={timezoneDelta} />
      <TimerOverview />
      <OffsetOverview />
      <MetadataTimes />
      <TimezoneBadge displayZone={displayZone} timezoneDelta={timezoneDelta} placement='inline' />
      <ClockOverview shouldFormat timezoneDelta={timezoneDelta} />
    </OverviewWrapper>
  );
}
