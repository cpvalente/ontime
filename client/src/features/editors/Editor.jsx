import { IconButton } from '@chakra-ui/button';
import { SettingsIcon } from '@chakra-ui/icons';
import { Grid, GridItem, Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
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
  const [webEvents, setWebEvents] = useState(null);
  const [event, setEvent] = useContext(EventContext);
  const [playback, setPlayback] = useState({
    current: null,
    next: null,
    currentTimer: null,
    numEvents: 0,
    state: 'pause',
    prevState: 'pause',
  });
  const updatePlayback = (vals) => {
    setPlayback({ ...playback, ...vals });
  };
  const [timer, setTimer] = useState({
    current: null,
    duration: null,
    started: null,
    finished: null,
  });
  const updateTimer = (vals) => {
    setTimer({ ...timer, ...vals });
  };

  // WEBSOCKETZ
  useEffect(() => {
    // TODO: add namespace?
    const socket = io('http://localhost:4001', { transport: ['websocket'] });
    console.log('websocket started');

    // Handle timer
    socket.on('timer', (data) => {
      console.log('got time', data);
      updateTimer(data);
    });

    // Handle events
    socket.on('eventdata', (data) => {
      console.log('got eventdata', data);
      setWebEvents(data);
    });

    return () => socket.disconnect();
  }, []);

  console.log('playback here', playback);
  console.log('events here', webEvents);

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
              events={webEvents}
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
              timer={timer}
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
