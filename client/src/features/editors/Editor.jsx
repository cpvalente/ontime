import { IconButton } from '@chakra-ui/button';
import { SettingsIcon } from '@chakra-ui/icons';
import { Grid, GridItem, Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import { useContext, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useState } from 'react';
import { EventListContext } from '../../app/context/eventListContext';
import NumberedText from '../../common/components/text/NumberedText';
import PlaybackControl from '../control/PlaybackControl';
import MessageForm from '../form/MessageForm';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventList from './list/EventList';
import EventListWrapper from './list/EventListWrapper';

export default function Editor() {
  const [formMode, setFormMode] = useState(null);
  const [webEvents, setWebEvents] = useState(null);
  const [playback, setPlayback] = useState({
    current: null,
    next: null,
    currentTimer: null,
    numEvents: 0,
    state: 'pause',
  });
  const updatePlayback = (vals) => {
    setPlayback({ ...playback, ...vals });
  };

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
            <EventListWrapper
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
            <PlaybackControl playback={playback} />
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
