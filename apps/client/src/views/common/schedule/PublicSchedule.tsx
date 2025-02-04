import { memo } from 'react';
import { MaybeString } from 'ontime-types';

import Schedule from './Schedule';
import { ScheduleProvider } from './ScheduleContext';
import ScheduleNav from './ScheduleNav';

interface PublicScheduleProps {
  selectedId: MaybeString;
}

export default memo(PublicSchedule);
function PublicSchedule(props: PublicScheduleProps) {
  const { selectedId } = props;
  return (
    <ScheduleProvider selectedEventId={selectedId}>
      <ScheduleNav className='schedule-nav-container' />
      <Schedule className='schedule-container' />
    </ScheduleProvider>
  );
}
