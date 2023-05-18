/* eslint-disable react/display-name */
import { ComponentType, useMemo } from 'react';
import { TitleBlock } from 'ontime-types';
import { useStore } from 'zustand';

import useEventData from '../../common/hooks-query/useEventData';
import useRundown from '../../common/hooks-query/useRundown';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { runtime } from '../../common/stores/runtime';
import { useViewOptionsStore } from '../../common/stores/viewOptions';

export type TitleManager = TitleBlock & { showNow: boolean; showNext: boolean };

const withData = <P extends object>(Component: ComponentType<P>) => {
  return (props: Partial<P>) => {
    // persisted app state
    const isMirrored = useViewOptionsStore((state) => state.mirror);

    // HTTP API data
    const { data: rundownData } = useRundown();
    const { data: eventData } = useEventData();
    const { data: viewSettings } = useViewSettings();

    const publicEvents = useMemo(() => {
      if (Array.isArray(rundownData)) {
        return rundownData.filter((e) => e.type === 'event' && e.title && e.isPublic);
      }
      return [];
    }, [rundownData]);

    // websocket data
    const data = useStore(runtime);
    const { timer, titles, titlesPublic, publicMessage, timerMessage, lowerMessage, playback, onAir } = data;
    const publicSelectedId = data.loaded.selectedPublicEventId;
    const selectedId = data.loaded.selectedEventId;
    const nextId = data.loaded.nextEventId;

    /********************************************/
    /***  + titleManager                      ***/
    /***  WRAP INFORMATION RELATED TO TITLES  ***/
    /***  ----------------------------------  ***/
    /********************************************/
    // is there a now field?
    let showNow = true;
    if (!titles.titleNow && !titles.subtitleNow && !titles.presenterNow) showNow = false;

    // is there a next field?
    let showNext = true;
    if (!titles.titleNext && !titles.subtitleNext && !titles.presenterNext) showNext = false;

    const titleManager: TitleManager = { ...titles, showNow: showNow, showNext: showNext };

    /********************************************/
    /***  + publicTitleManager               ***/
    /***  WRAP INFORMATION RELATED TO TITLES  ***/
    /***  ----------------------------------  ***/
    /********************************************/
    // is there a now field?
    let showPublicNow = true;
    if (!titlesPublic.titleNow && !titlesPublic.subtitleNow && !titlesPublic.presenterNow) showPublicNow = false;

    // is there a next field?
    let showPublicNext = true;
    if (!titlesPublic.titleNext && !titlesPublic.subtitleNext && !titlesPublic.presenterNext) showPublicNext = false;

    const publicTitleManager: TitleManager = {
      ...titlesPublic,
      showNow: showPublicNow,
      showNext: showPublicNext,
    };

    /******************************************/
    /***  + TimeManagerType                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    // inject info:
    // is timer finished
    // get clock string
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
        title={titleManager}
        publicTitle={publicTitleManager}
        time={TimeManagerType}
        events={publicEvents}
        backstageEvents={rundownData}
        selectedId={selectedId}
        publicSelectedId={publicSelectedId}
        viewSettings={viewSettings}
        nextId={nextId}
        general={eventData}
        onAir={onAir}
      />
    );
  };
};

export default withData;
