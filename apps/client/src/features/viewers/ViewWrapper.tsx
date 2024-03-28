import { ComponentType, useMemo } from 'react';
import { ViewExtendedTimer } from 'common/models/TimeManager.type';
import {
  CustomFields,
  Message,
  OntimeEvent,
  ProjectData,
  Settings,
  SupportedEvent,
  TimerMessage,
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
  backstageEvents: OntimeEvent[];
  customFields: CustomFields;
  eventNext: OntimeEvent | null;
  eventNow: OntimeEvent | null;
  events: OntimeEvent[];
  external: Message;
  general: ProjectData;
  isMirrored: boolean;
  lower: Message;
  nextId: string | null;
  onAir: boolean;
  pres: TimerMessage;
  publ: Message;
  publicEventNext: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  publicSelectedId: string | null;
  selectedId: string | null;
  settings: Settings | undefined;
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

    const publicEvents = useMemo(() => {
      if (Array.isArray(rundownData)) {
        return rundownData.filter((e) => e.type === SupportedEvent.Event && e.title && e.isPublic);
      }
      return [];
    }, [rundownData]);

    // websocket data
    const { clock, timer, message, onAir, eventNext, publicEventNext, publicEventNow, eventNow } =
      useStore(runtimeStore);
    const publicSelectedId = publicEventNow?.id ?? null;
    const selectedId = eventNow?.id ?? null;
    const nextId = eventNext?.id ?? null;

    /******************************************/
    /***  + TimeManagerType                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    const TimeManagerType = {
      ...timer,
      clock,
      timerType: eventNow?.timerType ?? null,
      timeWarning: eventNow?.timeWarning ?? null,
      timeDanger: eventNow?.timeWarning ?? null,
    };

    // prevent render until we get all the data we need
    if (!viewSettings) {
      return null;
    }

    return (
      <>
        <ViewNavigationMenu />
        <Component
          {...props}
          backstageEvents={rundownData}
          customFields={customFields}
          eventNext={eventNext}
          eventNow={eventNow}
          events={publicEvents}
          external={message.external}
          general={project}
          isMirrored={isMirrored}
          lower={message.lower}
          nextId={nextId}
          onAir={onAir}
          pres={message.timer}
          publ={message.public}
          publicEventNext={publicEventNext}
          publicEventNow={publicEventNow}
          publicSelectedId={publicSelectedId}
          selectedId={selectedId}
          settings={settings}
          time={TimeManagerType}
          viewSettings={viewSettings}
        />
      </>
    );
  };

  WithDataComponent.displayName = `WithData(${getDisplayName(Component)})`;
  return WithDataComponent;
};

export default withData;
