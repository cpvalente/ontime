import { MessageState, OntimeEvent, ProjectData, Runtime, Settings, SimpleTimerState } from 'ontime-types';

import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import type { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { getDefaultFormat } from '../../common/utils/time';

import { getStudioOptions } from './studio.options';
import StudioClock from './StudioClock';
import StudioTimers from './StudioTimers';

import './Studio.scss';

interface StudioProps {
  auxTimer: SimpleTimerState;
  eventNow: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  message: MessageState;
  time: ViewExtendedTimer;
  runtime: Runtime;
  onAir: boolean;
  settings: Settings | undefined;
}

export default function Studio(props: StudioProps) {
  const { eventNow, general, isMirrored, message, time, runtime, onAir, auxTimer, settings } = props;

  useWindowTitle('Studio Timers');

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const studioOptions = getStudioOptions(defaultFormat);

  return (
    <div className={cx(['studio', isMirrored && 'mirror'])}>
      <ViewParamsEditor viewOptions={studioOptions} />
      {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <StudioClock onAir={onAir} clock={time.clock} />
      <StudioTimers
        runtime={runtime}
        time={time}
        eventNow={eventNow}
        auxTimer={auxTimer.current}
        message={message}
        title={general.title}
      />
    </div>
  );
}
