import { ComponentType } from 'react';
import { ViewExtendedTimer } from 'common/models/TimeManager.type';
import {
  CustomFields,
  MessageState,
  OntimeEvent,
  ProjectData,
  Runtime,
  Settings,
  SimpleTimerState,
  TimerType,
  ViewSettings,
} from 'ontime-types';
import { useStore } from 'zustand';

import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { runtimeStore } from '../../common/stores/runtime';
import { useViewOptionsStore } from '../../common/stores/viewOptions';

type WithDataProps = {
  auxTimer: SimpleTimerState;
  events: OntimeEvent[];
  customFields: CustomFields;
  eventNext: OntimeEvent | null;
  eventNow: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  message: MessageState;
  nextId: string | null;
  onAir: boolean;
  runtime: Runtime;
  selectedId: string | null;
  settings: Settings | undefined; // TODO: what is the case for this being undefined?
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;
};

function getDisplayName(Component: React.ComponentType<any>): string {
  return Component.displayName || Component.name || 'Component';
}

const withData = <P extends WithDataProps>(Component: ComponentType<P>) => {
  const WithDataComponent = (props: P) => {
    // persisted app state
    const isMirrored = useViewOptionsStore((state) => state.mirror);

    // HTTP API data
    const { data: rundownData } = useFlatRundown();
    const { data: project } = useProjectData();
    const { data: viewSettings } = useViewSettings();
    const { data: settings } = useSettings();
    const { data: customFields } = useCustomFields();

    // websocket data
    const { clock, timer, message, onAir, eventNext, eventNow, runtime, auxtimer1 } = useStore(runtimeStore);
    const selectedId = eventNow?.id ?? null;
    const nextId = eventNext?.id ?? null;

    /**
     * Contains an extended timer object with properties from the current event
     */
    const timeManagerType: ViewExtendedTimer = {
      ...timer,
      clock,
      timerType: eventNow?.timerType ?? TimerType.CountDown,
      countToEnd: eventNow?.countToEnd ?? false,
    };

    return (
      <>
        <ViewNavigationMenu isLockable />
        <Component
          {...props}
          auxTimer={auxtimer1}
          events={rundownData}
          customFields={customFields}
          eventNext={eventNext}
          eventNow={eventNow}
          general={project}
          isMirrored={isMirrored}
          message={message}
          nextId={nextId}
          onAir={onAir}
          runtime={runtime}
          selectedId={selectedId}
          settings={settings}
          time={timeManagerType}
          viewSettings={viewSettings}
        />
      </>
    );
  };

  WithDataComponent.displayName = `WithData(${getDisplayName(Component)})`;
  return WithDataComponent;
};

export default withData;
