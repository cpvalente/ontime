/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react';
import { EVENT_TABLE, EVENTS_TABLE } from 'app/api/apiConstants';
import { fetchEvent } from 'app/api/eventApi';
import { fetchAllEvents } from 'app/api/eventsApi';
import { useSocket } from 'app/context/socketContext';
import { useFetch } from 'app/hooks/useFetch';

import { stringFromMillis } from '../../common/utils/time';

const withSocket = (Component) => {
  return (props) => {
    const { data: eventsData } = useFetch(EVENTS_TABLE, fetchAllEvents);
    const { data: genData } = useFetch(EVENT_TABLE, fetchEvent);

    const [publicEvents, setPublicEvents] = useState([]);
    const [backstageEvents, setBackstageEvents] = useState([]);

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
    const [timer, setTimer] = useState({
      clock: null,
      running: null,
      isNegative: null,
      startedAt: null,
      expectedFinish: null,
    });
    const [titles, setTitles] = useState({
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [publicTitles, setPublicTitles] = useState({
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [selectedId, setSelectedId] = useState(null);
    const [nextId, setNextId] = useState(null);
    const [publicSelectedId, setPublicSelectedId] = useState(null);
    const [general, setGeneral] = useState({
      title: '',
      url: '',
      publicInfo: '',
      backstageInfo: '',
      endMessage: '',
    });
    const [playback, setPlayback] = useState(null);
    const [onAir, setOnAir] = useState(false);

    // Ask for update on load
    useEffect(() => {
      if (socket == null) return;

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

      // Handle timer
      socket.on('timer', (data) => {
        setTimer({ ...data });
      });

      // Handle playstate
      socket.on('playstate', (data) => {
        setPlayback(data);
      });
      socket.on('onAir', (data) => {
        setOnAir(data);
      });

      // Handle titles
      socket.on('titles', (data) => {
        setTitles({ ...data });
      });
      socket.on('publictitles', (data) => {
        setPublicTitles({ ...data });
      });

      // Handle selected event
      socket.on('selected-id', (data) => {
        setSelectedId(data);
      });
      socket.on('publicselected-id', (data) => {
        setPublicSelectedId(data);
      });
      socket.on('next-id', (data) => {
        setNextId(data);
      });

      // Ask for up to date data
      socket.emit('get-messages');

      // Ask for up to data
      socket.emit('get-timer');

      // ask for timer
      socket.emit('get-timer');

      // ask for playstate
      socket.emit('get-playstate');
      socket.emit('get-onAir');

      // Ask for up titles
      socket.emit('get-titles');
      socket.emit('get-publictitles');

      // Ask for up selected
      socket.emit('get-selected-id');
      socket.emit('get-next-id');

      // Clear listeners
      return () => {
        socket.off('messages-public');
        socket.off('messages-timer');
        socket.off('messages-lower');
        socket.off('timer');
        socket.off('playstate');
        socket.off('onAir');
        socket.off('titles');
        socket.off('publictitles');
        socket.off('selected-id');
        socket.emit('next-id');
      };
    }, [socket]);

    // Filter events only to pass down
    useEffect(() => {
      if (eventsData == null) return;
      // filter just events with title
      if (Array.isArray(eventsData)) {
        const pe = eventsData.filter(
          (d) => d.type === 'event' && d.title !== '' && d.isPublic
        );
        setPublicEvents(pe);

        // everything goes backstage
        setBackstageEvents(eventsData);
      }
    }, [eventsData]);

    // Set general data
    useEffect(() => {
      if (genData == null) return;
      setGeneral(genData);
    }, [genData]);

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
      clock: stringFromMillis(timer.clock),
      clockMs: timer.clock,
      clockNoSeconds: stringFromMillis(timer.clock, false),
      playstate: playback,
    };

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
        backstageEvents={backstageEvents}
        selectedId={selectedId}
        publicSelectedId={publicSelectedId}
        nextId={nextId}
        general={general}
        onAir={onAir}
      />
    );
  };
};

export default withSocket;
