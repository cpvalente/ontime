import { memo, PropsWithChildren } from 'react';

import { ClockOverview, MetadataTimes, ProgressOverview, RuntimeOverview, StartTimes } from './composite/TimeElements';
import TitleOverview from './composite/TitleOverview';
import { OverviewWrapper } from './OverviewWrapper';

export default memo(EditorOverview);
function EditorOverview({ children }: PropsWithChildren) {
  return (
    <OverviewWrapper navElements={children}>
      <TitleOverview />
      <StartTimes />
      <ProgressOverview />
      <RuntimeOverview />
      <MetadataTimes />
      <ClockOverview />
    </OverviewWrapper>
  );
}
