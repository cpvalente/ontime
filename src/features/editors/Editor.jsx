import { Button } from '@chakra-ui/button';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Grid, GridItem, Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import { useContext } from 'react';
import { useEffect, useState } from 'react';
import { EventContext } from '../../app/context/eventContext';
import NumberedText from '../../common/components/text/NumberedText';
import PlaybackControl from '../control/PlaybackControl';
import EventForm from '../form/EventForm';
import MessageForm from '../form/MessageForm';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventList from './list/EventList';

export default function Editor() {
  const [formMode, setFormMode] = useState(null);
  const [event] = useContext(EventContext);

  useEffect(() => {
    if (event === null) {
      setFormMode(null);
    } else {
      setFormMode('edit');
    }
  }, [event]);

  return (
    <Grid
      templateRows='1fr 1fr 1fr'
      templateColumns='1fr 25vw 25vw 5vw'
      gap={5}
      className={styles.mainContainer}
    >
      <GridItem rowSpan={3}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Event List</Heading>
          <NumberedText
            number={1}
            text={'Manage and select event to run'}
          />
          <div className={styles.content}>
            <EventList formMode={formMode} setFormMode={setFormMode} />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowStart={2} rowSpan={2} colSpan={2}>
        <Box className={styles.editor} borderRadius='0.5em' overflowX='auto'>
          <Heading style={{ paddingBottom: '0.25em' }}>Preview Displays</Heading>
          <NumberedText number={4} text={'Realtime screen preview'} />
          <div className={styles.content}>
            <PreviewContainer />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowStart={1} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Display Messages</Heading>
          <NumberedText number={2} text={'Show realtime messages on separate screen types'} />
          <div className={styles.content}></div>
          <MessageForm />
        </Box>
      </GridItem>

      <GridItem colStart={3} rowStart={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Time Control</Heading>
          <NumberedText number={3} text={'Control Timer'} />
          <div className={styles.content}></div>
          <PlaybackControl />
        </Box>
      </GridItem>

      <GridItem colStart={4} rowSpan={3}>
        <Box className={styles.editor} borderRadius='0.5em'>S</Box>
      </GridItem>
    </Grid>
  );
}
