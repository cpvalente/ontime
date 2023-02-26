/* eslint-disable react/display-name */
import { useEffect, useMemo, useState } from 'react';

import { useMessageControl } from '../../common/hooks/useSocket';
import useSubscription from '../../common/hooks/useSubscription';
import useEventData from '../../common/hooks-query/useEventData';
import useRundown from '../../common/hooks-query/useRundown';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import socket from '../../common/utils/socket';

const withSocket = (Component) => {
  return (props) => {
    const { data: eventsData } = useRundown();
    const { data: genData } = useEventData();
    const { data: viewSettings } = useViewSettings();
    const { data: messageControl } = useMessageControl();

    const [publicSelectedId, setPublicSelectedId] = useState(null);

    const [timer] = useSubscription('timer', {
      clock: null,
      current: null,
      elapsed: null ,
      expectedFinish: null,
      addedTime: 0,
      startedAt: null,
      finishedAt: null,
      secondaryTimer: null,
    });
    const [titles] = useSubscription('titles', {
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [publicTitles] = useSubscription('titlesPublic', {
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [selectedId] = useSubscription('selected-id', null);
    const [nextId] = useSubscription('next-id', null);
    const [playback] = useSubscription('playback', null);

    // Ask for update on load
    useEffect(() => {
      // todo: remove
      socket.on('publicselected-id', (data) => {
        setPublicSelectedId(data);
      });
    }, []);


    const publicEvents = useMemo(() => {
      if (Array.isArray(eventsData)) {
        return eventsData.filter((d) => d.type === 'event' && d.title !== '' && d.isPublic);
      }
      return [];
    }, [eventsData]);

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
    if (!publicTitles.titleNow && !publicTitles.subtitleNow && !publicTitles.presenterNow)
      showPublicNow = false;

    // is there a next field?
    let showPublicNext = true;
    if (!publicTitles.titleNext && !publicTitles.subtitleNext && !publicTitles.presenterNext)
      showPublicNext = false;

    const publicTitleManager = {
      ...publicTitles,
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
      finished: playback === 'play' && timer.current < 0 && timer.startedAt,
      playback,
    };

    // prevent render until we get all the data we need
    if (!viewSettings) {
      return null;
    }

    Component.displayName = 'ComponentWithData';
    return (
      <Component
        {...props}
        pres={messageControl.messages.presenter}
        publ={messageControl.messages.public}
        lower={messageControl.messages.lower}
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
        onAir={messageControl.onAir}
      />
    );
  };
};

export default withSocket;
