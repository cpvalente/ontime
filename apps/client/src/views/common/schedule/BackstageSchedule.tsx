import { memo } from 'react';
import { MaybeString } from 'ontime-types';

import Schedule from './Schedule';
import { ScheduleProvider } from './ScheduleContext';
import ScheduleNav from './ScheduleNav';

interface BackstageScheduleProps {
  selectedId: MaybeString;
}

export default memo(BackstageSchedule);
function BackstageSchedule(props: BackstageScheduleProps) {
  const { selectedId } = props;
  return (
    <ScheduleProvider selectedEventId={selectedId} isBackstage>
      <ScheduleNav className='schedule-nav-container' />
      <Schedule isProduction className='schedule-container' />
    </ScheduleProvider>
  );
}
