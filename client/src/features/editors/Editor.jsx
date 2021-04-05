import { IconButton } from '@chakra-ui/button';
import { SettingsIcon } from '@chakra-ui/icons';
import { Grid, GridItem, Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import { addSeconds, getHours, getMinutes, getSeconds } from 'date-fns';
import { differenceInSeconds } from 'date-fns/esm';
import { useContext } from 'react';
import { useEffect, useState } from 'react';
import { EventContext } from '../../app/context/eventContext';
import { EventListContext } from '../../app/context/eventListContext';
import NumberedText from '../../common/components/text/NumberedText';
import PlaybackControl from '../control/PlaybackControl';
import MessageForm from '../form/MessageForm';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventList from './list/EventList';
import { io } from 'socket.io-client';

export default function Editor() {
  const [formMode, setFormMode] = useState(null);
  const [events] = useContext(EventListContext);
  const [event, setEvent] = useContext(EventContext);
  const [playback, setPlayback] = useState({
    current: null,
    next: null,
    currentTimer: null,
    numEvents: 0,
    state: 'pause',
    prevState: 'pause',
  });

  const [response, setResponse] = useState('');

  // WEBSOCKETZ
  useEffect(() => {
    // TODO: add namespace?
    const socket = io('http://localhost:4001', { transport: ['websocket'] });
    console.log('websocket started');

    socket.on('FromAPI', (data) => {
      console.log('got date', data);
    });

    socket.on('eventdata', (data) => {
      console.log('got eventdata', data);
    });

    return () => socket.disconnect();
  }, []);

  // Timer stuff
  const [timer, setTimer] = useState({
    TIMER_UPDATE_INTERVAL: 250,
    currentTime: null,
    currentTimeSeconds: null,
    playMode: 'stop',

    isStarted: false,
    isRunning: false,

    startTime: null,
    pauseTime: null,

    lastRun: null,
    elapsedTime: 0,

    elapsedStartedTime: 0,
    elapsedRunningTime: 0,

    totalElapsedPausedTime: 0,
    periodElapsedPausedTime: 0,

    elapsedResumeTime: 0,

    targetTime: null,
  });

  // update timer object
  const updateTimer = (vals) => {
    setTimer({ ...timer, ...vals });
  };

  // set timer target
  const setTimerTargetinSeconds = (target) => {
    const t = addSeconds(new Date(), target);
    updateTimer({ currentTime: t, currentTimeSeconds: target, targetTime: t });
  };

  // timer playback control
  const setTimerState = (state) => {
    const now = new Date();

    switch (state) {
      case 'play': {
        updateTimer({
          playMode: state,
          isStarted: true,
          startTime: now,
          lastRun: now,
        });
        break;
      }
      case 'pause': {
        updateTimer({ playMode: state, pauseTime: now, isRunning: false });
        break;
      }

      default:
        break;
    }
  };

  // update
  const updateTime = () => {
    // exit if we are not ready
    if (timer.startTime == null) return;

    // aux
    const now = new Date();

    // how long has the time been running
    const elapsedTime = now - timer.startTime;

    if (timer.playMode === 'play') {
      // current time here
      const currentTime = timer.targetTime - elapsedTime;
      updateTimer({
        currentTime: currentTime,
        currentTimeSeconds: getSeconds(currentTime),
        elapsedTime: elapsedTime,
        lastRun: now,
      });
    }

    if (timer.playMode === 'pause') {
      const pausedTime = now - timer.pauseTime;
      updateTimer({
        totalElapsedPausedTime: timer.totalElapsedPausedTime + pausedTime,
        periodElapsedPausedTime: timer.periodElapsedPausedTime + now,
        elapsedTime: elapsedTime,
        lastRun: now,
      });
    }

    // call again
    setTimeout(updateTime, timer.TIMER_UPDATE_INTERVAL);
  };

  // when playmode changes, we might schedule a timer
  // is this enough for change or should i check prevstate?
  useEffect(() => {
    if (playback.state !== 'stop' || playback.state !== null) {
      updateTime();
    }
  }, [playback.state]);

  const updatePlayback = (vals) => {
    setPlayback({ ...playback, ...vals });
  };

  // gets timer on current
  // ?? I have already done this a few times,
  // maybe loop once and get all data?
  const getCurrentTime = (target) => {
    if (events !== null) {
      // loop through events to find target
      const filteredEvents = events.filter((e) => e.type === 'event');
      const curEvent = filteredEvents[target];

      // set as event
      setEvent(curEvent);

      // extract time only from dates
      let minStart = getHours(curEvent.timeStart) * 60;
      minStart = minStart + getMinutes(curEvent.timeStart);

      let minEnd = getHours(curEvent.timeEnd) * 60;
      minEnd = minEnd + getMinutes(curEvent.timeEnd);

      // return time in seconds
      return (minEnd - minStart) * 60;
    }
  };

  const playbackControl = (action, payload) => {
    switch (action) {
      case 'play': {
        if (playback.state !== 'play') {
          updatePlayback({ state: 'play', prevState: playback.state });
          setTimerState('play');
        }
        break;
      }
      case 'pause': {
        if (playback.state !== 'pause') {
          updatePlayback({ state: 'pause', prevState: playback.state });
          setTimerState('pause');
        }
        break;
      }
      case 'roll': {
        if (playback.state === 'roll' && playback.prevState !== 'roll') {
          updatePlayback({ state: playback.prevState, prevState: 'roll' });
        } else {
          updatePlayback({ state: 'roll', prevState: playback.state });
        }
        break;
      }
      case 'previous': {
        if (playback.numEvents !== null) {
          let cur = null,
            nxt = null;
          if (playback.current === null || playback.current === 0) {
            cur = 0;
          } else {
            cur = playback.current - 1;
          }
          if (playback.numEvents > 1) nxt = cur + 1;
          if (nxt > playback.numEvents) nxt = playback.numEvents;

          // get time
          let time = getCurrentTime(cur);
          // update playback
          updatePlayback({ current: cur, next: nxt, currentTimer: time });
          // set timer
          setTimerTargetinSeconds(time);
        }
        break;
      }
      case 'next': {
        if (playback.numEvents !== null) {
          let cur = null,
            nxt = null;
          if (playback.current === null) {
            cur = 0;
          } else {
            cur = playback.next;
          }
          if (playback.numEvents > 1) nxt = cur + 1;
          if (nxt >= playback.numEvents) nxt = playback.numEvents - 1;

          // get time
          let time = getCurrentTime(cur);
          // update playback
          updatePlayback({ current: cur, next: nxt, currentTimer: time });
          // set timer
          setTimerTargetinSeconds(time);
        }
        break;
      }
      default:
        break;
    }
  };

  console.log('playback here', playback);
  console.log('timer here', timer);

  return (
    <Grid
      templateRows='1fr 1fr 1fr'
      templateColumns='1fr 25vw 25vw 5vw'
      gap={5}
      className={styles.mainContainer}
    >
      <GridItem rowSpan={3}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading size='lg' style={{ paddingBottom: '0.25em' }}>
            Event List
          </Heading>
          <NumberedText number={1} text={'Manage and select event to run'} />
          <div className={styles.content}>
            <EventList
              formMode={formMode}
              setFormMode={setFormMode}
              selected={playback.current}
              updatePlayback={updatePlayback}
            />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowStart={2} rowSpan={2} colSpan={2}>
        <Box className={styles.editor} borderRadius='0.5em' overflowX='auto'>
          <Heading size='lg' style={{ paddingBottom: '0.25em' }}>
            Preview Displays
          </Heading>
          <NumberedText number={4} text={'Realtime screen preview'} />
          <div className={styles.content}>
            <PreviewContainer />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowStart={1} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading size='lg' style={{ paddingBottom: '0.25em' }}>
            Display Messages
          </Heading>
          <NumberedText
            number={2}
            text={'Show realtime messages on separate screen types'}
          />
          <div className={styles.content}>
            <MessageForm />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={3} rowStart={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading size='lg' style={{ paddingBottom: '0.25em' }}>
            Time Control
          </Heading>
          <NumberedText number={3} text={'Control Timer'} />
          <div className={styles.content}>
            <PlaybackControl
              playback={playback}
              playbackControl={playbackControl}
              time={timer.currentTimeSeconds}
              roll={playback.state === 'roll'}
            />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={4} rowSpan={3}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2em',
              paddingTop: '3em',
            }}
          >
            <IconButton icon={<SettingsIcon />} isRound variant='outline' />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#3b8cd8',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#3182ce',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#2778c4',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#1d6eba',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#1364b0',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: 35,
                height: 35,
                backgroundColor: '#095aa6',
                borderRadius: '50%',
              }}
            />
          </div>
        </Box>
      </GridItem>
    </Grid>
  );
}
