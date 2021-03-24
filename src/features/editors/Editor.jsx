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
      templateRows='60% 40%'
      templateColumns='repeat(3, 1fr)'
      gap={5}
      className={styles.mainContainer}
    >
      <GridItem rowSpan={2} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>List Events</Heading>
          <NumberedText
            number={1}
            text={'Select event or click Add Event to create new'}
          />
          <div className={styles.cornerButtonContainer}>
            <Button
              colorScheme='teal'
              variant={formMode === 'add' ? 'solid' : 'outline'}
              rightIcon={<ArrowForwardIcon />}
              disabled={formMode !== null}
              onClick={() => setFormMode('add')}
            >
              Add Event
            </Button>
          </div>

          <div className={styles.content}>
            <EventList formMode={formMode} setFormMode={setFormMode} />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Event Details</Heading>
          <NumberedText number={2} text={'Edit event info'} />
          <div className={styles.content}>
            <EventForm formMode={formMode} setFormMode={setFormMode} />
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={3} rowStart={1} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em' overflowX='auto'>
          <Heading style={{ paddingBottom: '0.25em' }}>Screens</Heading>
          <NumberedText number={3} text={'Preview layout'} />
          <div className={styles.content}>
            {/* <PreviewContainer data={selectedData} /> */}
          </div>
        </Box>
      </GridItem>

      <GridItem colStart={2} rowStart={2} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Screen Messages</Heading>
          <NumberedText number={3} text={'Show / Hide messages on screens'} />
          <div className={styles.content}></div>
          <MessageForm />
        </Box>
      </GridItem>

      <GridItem colStart={3} rowStart={2} rowSpan={1} colSpan={1}>
        <Box className={styles.editor} borderRadius='0.5em'>
          <Heading style={{ paddingBottom: '0.25em' }}>Time Control</Heading>
          <NumberedText number={0} text={'Control Timer'} />
          <div className={styles.content}></div>
          <PlaybackControl />
        </Box>
      </GridItem>
    </Grid>
  );
}
