import { useEffect, useState } from 'react';
import { eventsNamespace, fetchAllEvents } from '../../app/api/eventsApi';
import { fetchEvent, eventNamespace } from '../../app/api/eventApi';
import { useSocket } from '../../app/context/socketContext';
import { stringFromMillis } from '../../common/dateConfig';
import { useFetch } from '../../app/hooks/useFetch';

const withSocket = (Component) => {
  const WrappedComponent = (props) => {
    const {
      data: eventsData,
      status: eventsDataStatus,
      isError: eventsDataIsError,
    } = useFetch(eventsNamespace, fetchAllEvents);
    const {
      data: genData,
      status: genDataStatus,
      isError: genDataIsError,
    } = useFetch(eventNamespace, fetchEvent);

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
    const [publicTitles, setPublicTitles] = useState({
      titleNow: '',
      subtitleNow: '',
      presenterNow: '',
      titleNext: '',
      subtitleNext: '',
      presenterNext: '',
    });
    const [selectedId, setSelectedId] = useState(null);
    const [publicSelectedId, setPublicSelectedId] = useState(null);
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
      socket.emit('get-publictitles');

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
        socket.off('publictitles');
        socket.off('selected-id');
      };
    }, [socket]);

    // Filter events only to pass down
    useEffect(() => {
      if (eventsData == null) return;

      // filter just events with title
      const pe = eventsData.filter(
        (d) => d.type === 'event' && d.title !== '' && d.isPublic === true
      );
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

    /********************************************/
    /***  + publicTitleManager               ***/
    /***  WRAP INFORMATION RELATED TO TITLES  ***/
    /***  ----------------------------------  ***/
    /********************************************/
    // is there a now field?
    let showPublicNow = true;
    if (
      !publicTitles.titleNow &&
      !publicTitles.subtitleNow &&
      !publicTitles.presenterNow
    )
      showPublicNow = false;

    // is there a next field?
    let showPublicNext = true;
    if (
      !publicTitles.titleNext &&
      !publicTitles.subtitleNext &&
      !publicTitles.presenterNext
    )
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
      finished: timer.running <= 0 && timer.startedAt,
      clock: stringFromMillis(timer.clock),
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
        general={general}
      />
    );
  };

  return WrappedComponent;
};

export default withSocket;
