import { ReactNode, useMemo } from 'react';
import { Playback } from 'ontime-types';

import useEventData from '../../common/hooks-query/useEventData';
import useRundown from '../../common/hooks-query/useRundown';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useRuntimeStore } from '../../common/stores/runtime';

const withData = (Component: ReactNode) => {
  return (props) => {

    // HTTP API data
    const { data: eventsData } = useRundown();
    const { data: genData } = useEventData();
    const { data: viewSettings } = useViewSettings();

    const publicEvents = useMemo(() => {
      if (Array.isArray(eventsData)) {
        return eventsData.filter((e) => e.type === 'event' && e.title && e.isPublic);
      }
      return [];
    }, [eventsData]);

    // websocket data
    const data = useRuntimeStore();
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

    const titleManager = { ...titles, showNow: showNow, showNext: showNext };

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

    const publicTitleManager = {
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
      finished: playback === Playback.Play && (timer.current ?? 0) < 0 && timer.startedAt,
      playback,
    };

    // prevent render until we get all the data we need
    if (!viewSettings) {
      return null;
    }

    return (
      <Component
        {...props}
        pres={timerMessage}
        publ={publicMessage}
        lower={lowerMessage}
        title={titleManager}
        publicTitle={publicTitleManager}
        time={TimeManagerType}
        events={publicEvents}
        backstageEvents={eventsData}
        selectedId={selectedId}
        publicSelectedId={publicSelectedId}
        viewSettings={viewSettings}
        nextId={nextId}
        general={genData}
        onAir={onAir}
      />
    );
  };
};

export default withData;
