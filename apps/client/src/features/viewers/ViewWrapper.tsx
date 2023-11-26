import { ComponentType, useMemo } from 'react';
import { TimeManagerType } from 'common/models/TimeManager.type';
import { Message, OntimeEvent, ProjectData, Settings, SupportedEvent, TimerMessage, ViewSettings } from 'ontime-types';
import { useStore } from 'zustand';

import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { runtime } from '../../common/stores/runtime';
import { useViewOptionsStore } from '../../common/stores/viewOptions';

type WithDataProps = {
  isMirrored: boolean;
  pres: TimerMessage;
  publ: Message;
  lower: Message;
  external: Message;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  time: TimeManagerType;
  events: OntimeEvent[];
  backstageEvents: OntimeEvent[];
  selectedId: string | null;
  publicSelectedId: string | null;
  nextId: string | null;
  general: ProjectData;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
  onAir: boolean;
};

function getDisplayName(Component: React.ComponentType<any>): string {
  return Component.displayName || Component.name || 'Component';
}

const withData = <P extends WithDataProps>(Component: ComponentType<P>) => {
  const WithDataComponent = (props: P) => {
    // persisted app state
    const isMirrored = useViewOptionsStore((state) => state.mirror);

    // HTTP API data
    const { data: rundownData } = useRundown();
    const { data: project } = useProjectData();
    const { data: viewSettings } = useViewSettings();
    const { data: settings } = useSettings();

    const publicEvents = useMemo(() => {
      if (Array.isArray(rundownData)) {
        return rundownData.filter((e) => e.type === SupportedEvent.Event && e.title && e.isPublic);
      }
      return [];
    }, [rundownData]);

    // websocket data
    const {
      timer,
      publicMessage,
      timerMessage,
      lowerMessage,
      externalMessage,
      playback,
      onAir,
      eventNext,
      publicEventNext,
      publicEventNow,
      eventNow,
      loaded,
    } = useStore(runtime);
    const publicSelectedId = loaded.selectedPublicEventId;
    const selectedId = loaded.selectedEventId;
    const nextId = loaded.nextEventId;

    /******************************************/
    /***  + TimeManagerType                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    const TimeManagerType = {
      ...timer,
      playback,
    };

    // prevent render until we get all the data we need
    if (!viewSettings) {
      return null;
    }

    return (
      <Component
        {...props}
        isMirrored={isMirrored}
        pres={timerMessage}
        publ={publicMessage}
        lower={lowerMessage}
        external={externalMessage}
        eventNow={eventNow}
        publicEventNow={publicEventNow}
        eventNext={eventNext}
        publicEventNext={publicEventNext}
        time={TimeManagerType}
        events={publicEvents}
        backstageEvents={rundownData}
        selectedId={selectedId}
        publicSelectedId={publicSelectedId}
        viewSettings={viewSettings}
        settings={settings}
        nextId={nextId}
        general={project}
        onAir={onAir}
      />
    );
  };

  WithDataComponent.displayName = `WithData(${getDisplayName(Component)})`;
  return WithDataComponent;
};

export default withData;
