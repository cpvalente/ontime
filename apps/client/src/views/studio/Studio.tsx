import { MessageState, OntimeEvent, ProjectData, Runtime, Settings, ViewSettings } from 'ontime-types';

import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import type { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { getDefaultFormat } from '../../common/utils/time';

import { getStudioOptions, useStudioOptions } from './studio.options';
import StudioClock from './StudioClock';
import StudioTimers from './StudioTimers';

import './Studio.scss';

interface StudioProps {
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  message: MessageState;
  time: ViewExtendedTimer;
  runtime: Runtime;
  onAir: boolean;
  settings: Settings | undefined;
  viewSettings: ViewSettings;
}

export default function Studio({
  eventNow,
  eventNext,
  general,
  isMirrored,
  message,
  time,
  runtime,
  onAir,
  settings,
  viewSettings,
}: StudioProps) {
  useWindowTitle('Studio Clock');
  const { hideCards } = useStudioOptions();

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const studioOptions = getStudioOptions(defaultFormat);

  return (
    <div className={cx(['studio', isMirrored && 'mirror'])} data-testid='studio-view'>
      <ViewParamsEditor viewOptions={studioOptions} />

      <div className='project-header'>
        {general?.logo && <ViewLogo name={general.logo} className='logo' />}
        <div className='title'>{general.title}</div>
      </div>

      <div className={cx(['studio-contents', hideCards && 'studio-contents--onecol'])}>
        <StudioClock onAir={onAir} clock={time.clock} hideCards={hideCards} />
        {!hideCards && (
          <StudioTimers
            eventNow={eventNow}
            eventNext={eventNext}
            timerMessage={message.timer.visible ? message.timer.text : ''}
            secondaryMessage={message.secondary}
            runtime={runtime}
            time={time}
            viewSettings={viewSettings}
          />
        )}
      </div>
    </div>
  );
}
