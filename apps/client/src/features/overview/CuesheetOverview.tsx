import { memo, PropsWithChildren } from 'react';

import { useIsMobileScreen } from '../../common/hooks/useIsMobileScreen';

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
  return (
    <OverviewWrapper navElements={children}>
      <TimerOverview />
      <OffsetOverview />
    </OverviewWrapper>
  );
}

function CuesheetDesktop({ children }: PropsWithChildren) {
  return (
    <OverviewWrapper navElements={children}>
      <TitleOverview />
      <StartTimesRuntime shouldFormat />
      <TimerOverview />
      <OffsetOverview />
      <MetadataTimes />
      <ClockOverview shouldFormat />
    </OverviewWrapper>
  );
}
