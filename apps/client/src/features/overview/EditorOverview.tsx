import { memo, PropsWithChildren } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import { ClockOverview, MetadataTimes, OffsetOverview, ProgressOverview, StartTimes } from './composite/TimeElements';
import TitleOverview from './composite/TitleOverview';
import { OverviewWrapper } from './OverviewWrapper';

export default memo(EditorOverview);
function EditorOverview({ children }: PropsWithChildren) {
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
      {overviewSettings.showProgress && <ProgressOverview />}
      {overviewSettings.showOverUnder && <OffsetOverview />}
      {overviewSettings.showTimeToGroupEnd && <MetadataTimes />}
      {overviewSettings.showTimeNow && <ClockOverview />}
    </OverviewWrapper>
  );
}
