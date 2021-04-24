import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { eventsNamespace, fetchAllEvents } from '../../app/api/eventsApi';
import { fetchEvent, eventNamespace } from '../../app/api/eventApi';
import { useSocket } from '../../app/context/socketContext';
import { stringFromMillis } from '../../common/dateConfig';

const withSocket = (Component) => {
  const WrappedComponent = (props) => {
    const {
      data: eventsData,
      status: eventsDataStatus,
      isError: eventsDataIsError,
    } = useQuery(eventsNamespace, fetchAllEvents);
    const {
      data: genData,
      status: genDataStatus,
      isError: genDataIsError,
    } = useQuery(eventNamespace, fetchEvent);

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
      currentSeconds: null,
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
    const [selectedId, setSelectedId] = useState({});
    const [general, setGeneral] = useState({
      title: '',
      url: '',
      publicInfo: '',
      backstageInfo: '',
    });
    const [playback, setPlayback] = useState(null);

    // Ask for update on load
    useEffect(() => {
      if (socket == null) return;

      // Handle presenter messages
      socket.on('messages-presenter', (data) => {
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

      // Handle titles
      socket.on('titles', (data) => {
        setTitles({ ...data });
      });

      // Handle selected event
      socket.on('selected-id', (data) => {
        setSelectedId(data);
      });

      // Ask for up to date data
      socket.emit('get-messages');

      // Ask for up to data
      socket.emit('get-presenter');

      // ask for timer
      socket.emit('get-timer');

      // ask for playstate
      socket.emit('get-playstate');

      // Ask for up titles
      socket.emit('get-titles');

      // Ask for up selected
      socket.emit('get-selected-id');

      // Clear listeners
      return () => {
        socket.off('messages-public');
        socket.off('messages-presenter');
        socket.off('messages-lower');
        socket.off('timer');
        socket.off('playstate');
        socket.off('titles');
        socket.off('selected-id');
      };
    }, [socket]);

    // Filter events only to pass down
    useEffect(() => {
      if (eventsData == null) return;

      // filter just events with title
      const pe = eventsData.filter((d) => d.type === 'event' && d.title !== '');
      setPublicEvents(pe);

      // everything goes backstage
      setBackstageEvents(eventsData);
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
    if (!titles.titleNow && !titles.subtitleNow && !titles.presenterNow)
      showNow = false;

    // is there a next field?
    let showNext = true;
    if (!titles.titleNext && !titles.subtitleNext && !titles.presenterNext)
      showNext = false;

    const titleManager = { ...titles, showNow: showNow, showNext: showNext };

    /******************************************/
    /***  + timeManager                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    // is timer finished
    let finished = timer.currentSeconds <= 0;

    // get clock
    let clock = stringFromMillis(timer.clock);

    const timeManager = {
      ...timer,
      finished: finished,
      clock: clock,
      playstate: playback,
    };

    return (
      <Component
        {...props}
        pres={pres}
        publ={publ}
        lower={lower}
        title={titleManager}
        time={timeManager}
        events={publicEvents}
        backstageEvents={backstageEvents}
        selectedId={selectedId}
        general={general}
      />
    );
  };

  return WrappedComponent;
};

export default withSocket;
