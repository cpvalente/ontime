import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import { stringFromMillis } from '../../common/dateConfig';

const withSocket = (Component) => {
  const WrappedComponent = (props) => {
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

      // Handle timer
      socket.on('titles', (data) => {
        setTitles({ ...data });
      });

      // Ask for up to date data
      socket.emit('get-messages');

      // Ask for up to data
      socket.emit('get-presenter');

      // Ask for up titles
      socket.emit('get-titles');

      // Clear listeners
      return () => {
        socket.off('messages-public');
        socket.off('messages-presenter');
        socket.off('messages-lower');
        socket.off('timer');
        socket.off('titles');
      };
    }, [socket]);

    /********************************************/
    /***  + titleManager                      ***/
    /***  WRAP INFORMATION RELATED TO TITLES  ***/
    /***  ----------------------------------  ***/
    /********************************************/
    // is there a next field?
    let showNext = true;
    if (!titles.titleNext && !titles.subtitleNext && !titles.presenterNext)
      showNext = false;

    const titleManager = { ...titles, showNext: showNext };

    /******************************************/
    /***  + timeManager                     ***/
    /***  WRAP INFORMATION RELATED TO TIME  ***/
    /***  --------------------------------  ***/
    /******************************************/

    // is timer finished
    let finished = timer.currentSeconds <= 0;

    // get clock
    let clock = stringFromMillis(timer.clock);

    const timeManager = { ...timer, finished: finished, clock: clock };

    return (
      <Component
        {...props}
        pres={pres}
        publ={publ}
        lower={lower}
        title={titleManager}
        time={timeManager}
      />
    );
  };

  return WrappedComponent;
};

export default withSocket;
