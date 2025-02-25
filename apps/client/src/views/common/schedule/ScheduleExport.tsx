import { memo } from 'react';
import { MaybeString } from 'ontime-types';

import Schedule from './Schedule';
import { ScheduleProvider } from './ScheduleContext';
import ScheduleNav from './ScheduleNav';

interface ScheduleExportProps {
  selectedId: MaybeString;
  isBackstage?: boolean;
}

export default memo(ScheduleExport);
function ScheduleExport(props: ScheduleExportProps) {
  const { selectedId, isBackstage } = props;
  return (
    <ScheduleProvider selectedEventId={selectedId} isBackstage>
      <ScheduleNav className='schedule-nav-container' />
      <Schedule isProduction={isBackstage} className='schedule-container' />
    </ScheduleProvider>
  );
}
