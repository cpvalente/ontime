import { memo, PropsWithChildren } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import { useIsMobileScreen } from '../../common/hooks/useIsMobileScreen';

import { ClockOverview, MetadataTimes, OffsetOverview, StartTimes, TimerOverview } from './composite/TimeElements';
import TitleOverview from './composite/TitleOverview';
import { OverviewWrapper } from './OverviewWrapper';

export default memo(CuesheetOverview);
function CuesheetOverview({ children }: PropsWithChildren) {
  const isMobileScreen = useIsMobileScreen();

  if (isMobileScreen) return <CuesheetMobile>{children}</CuesheetMobile>;
  else return <CuesheetDesktop>{children}</CuesheetDesktop>;
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
  const [overviewSettings] = useSessionStorage({
    key: 'overviewSettings',
    defaultValue: {
      showScheduleTimes: true,
      showProgress: true,
      showOverUnder: true,
      showTimeToGroupEnd: true,
      showTimeToFlag: true,
      showTimeNow: true,
      timeMode: 'all',
    },
  });

  return (
    <OverviewWrapper navElements={children}>
      <TitleOverview />
      {overviewSettings.showScheduleTimes && <StartTimes />}
      {overviewSettings.showProgress && <TimerOverview />}
      {overviewSettings.showOverUnder && <OffsetOverview />}
      {overviewSettings.showTimeToGroupEnd && <MetadataTimes />}
      {overviewSettings.showTimeNow && <ClockOverview />}
    </OverviewWrapper>
  );
}
