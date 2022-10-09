/* eslint-disable react/display-name */
import { useEffect, useMemo, useState } from 'react';

import { EVENT_TABLE, EVENTS_TABLE } from '../../common/api/apiConstants';
import { fetchEvent } from '../../common/api/eventApi';
import { fetchAllEvents } from '../../common/api/eventsApi';
import { useSocket } from '../../common/context/socketContext';
import { useFetch } from '../../common/hooks/useFetch';
import { getView } from '../../common/api/ontimeApi';
import useSubscription from '../../common/context/useSubscription';
import { eventPlaceholderSettings } from '../../common/api/ontimeApi';

const withSocket = (Component) => {
  return (props) => {
    const { data: eventsData } = useFetch(EVENTS_TABLE, fetchAllEvents, {
      placeholderData: [],
    });
    const { data: genData } = useFetch(EVENT_TABLE, fetchEvent, {
      placeholderData: eventPlaceholderSettings,
    });
    const { data: viewSettings } = useFetch(VIEW_SETTINGS, getView);

    const socket = useSocket();
    const [pres, setPres] = useState({
      text: '',
      visible: false,
    });
    const [publ, setPubl] = useState({
      text: '',
      visible: false,
    });
    const [lower, setLower] = useState({
      text: '',
      visible: false,
    });
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

      // Handle timer messages
      socket.on('messages-timer', (data) => {
        setPres({ ...data });
      });

      // Handle public messages
      socket.on('messages-public', (data) => {
        setPubl({ ...data });
      });

      // Handle lower third messages
      socket.on('messages-lower', (data) => {
        setLower({ ...data });
      });

      socket.on('publicselected-id', (data) => {
        setPublicSelectedId(data);
      });

      // Ask for up to date data
      socket.emit('get-messages');

      // Clear listeners
      return () => {
        socket.off('messages-public');
        socket.off('messages-timer');
        socket.off('messages-lower');
      };
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
    /***  + timeManager                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    // inject info:
    // is timer finished
    // get clock string
    const timeManager = {
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
        pres={pres}
        publ={publ}
        lower={lower}
        title={titleManager}
        publicTitle={publicTitleManager}
        time={timeManager}
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

export default withSocket;
