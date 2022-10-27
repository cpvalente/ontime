/* eslint-disable react/display-name */
import { useEffect, useMemo, useState } from 'react';

import { useSocket } from '../../common/context/socketContext';
import { useMessageControlProvider } from '../../common/hooks/useSocketProvider';
import useSubscription from '../../common/hooks/useSubscription';
import useEvent from '../../common/hooks-query/useEvent';
import useEventsList from '../../common/hooks-query/useEventsList';
import useViewSettings from '../../common/hooks-query/useViewSettings';

const withSocket = (Component) => {
  return (props) => {
    const { data: eventsData } = useEventsList();
    const { data: genData } = useEvent();
    const { data: viewSettings } = useViewSettings();
    const { data: messages } = useMessageControlProvider();

    const socket = useSocket();
    const [publicSelectedId, setPublicSelectedId] = useState(null);

    const [timer] = useSubscription('timer', {
      clock: 0,
      running: 0,
      isNegative: false,
      startedAt: null,
      expectedFinish: null,
    });
    const [titles] = useSubscription('titles', {
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [publicTitles] = useSubscription('publictitles', {
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [selectedId] = useSubscription('selected-id', null);
    const [nextId] = useSubscription('next-id', null);
    const [playback] = useSubscription('playstate', null);
    const [onAir] = useSubscription('onAir', false);

    // Ask for update on load
    useEffect(() => {
      if (!socket) {
        return;
      }
      // todo: remove
      socket.on('publicselected-id', (data) => {
        setPublicSelectedId(data);
      });
    }, [socket]);


    const publicEvents = useMemo(() => {
      if (Array.isArray(eventsData)) {
        return eventsData.filter((d) => d.type === 'event' && d.title !== '' && d.isPublic);
      } else {
        return [];
      }
    },[eventsData])

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
      finished: playback === 'start' && timer.isNegative && timer.startedAt,
      playstate: playback,
    };

    // prevent render until we get all the data we need
    if (!viewSettings) {
      return null;
    }

    Component.displayName = 'ComponentWithData';
    return (
      <Component
        {...props}
        pres={messages.presenter}
        publ={messages.public}
        lower={messages.lower}
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
        onAir={messages.onAir}
      />
    );
  };
};

export default withSocket;
