import { Button } from '@chakra-ui/button';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Heading } from '@chakra-ui/layout';
import { SimpleGrid } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import { useEffect, useState } from 'react';
import { sampleData } from '../../app/sampleData';
import NumberedText from '../../common/components/text/NumberedText';
import EventForm from '../form/EventForm';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventList from './list/EventList';

export default function Editor() {
  const [data, setData] = useState(sampleData);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formMode, setFormMode] = useState(null);

  useEffect(() => {
    if (selectedEvent === null) {
      setSelectedData(null);
      setFormMode(null);
    } else {
      const se = data.events.filter((d) => d.id === selectedEvent);
      if (se.length > 0) setSelectedData(se[0]);
      setFormMode('edit');
    }
  }, [data, selectedEvent]);

  return (
    <SimpleGrid
      minChildWidth='120px'
      spacing='40px'
      className={styles.mainContainer}
    >
      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading style={{ paddingBottom: '0.25em' }}>List Events</Heading>
        <NumberedText
          number={1}
          text={'Select event or click Add Event to create new'}
        />
        <div className={styles.content}>
          <EventList
            data={data}
            selected={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            formMode={formMode}
          />
          <div className={styles.buttonContainer}>
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
        </div>
      </Box>

      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading style={{ paddingBottom: '0.25em' }}>Event Details</Heading>
        <NumberedText number={2} text={'Edit event info'} />
        <div className={styles.content}>
          <EventForm
            data={selectedData}
            formMode={formMode}
            setFormMode={setFormMode}
            setSelectedEvent={setSelectedEvent}
          />
        </div>
      </Box>

      <Box className={styles.editor} borderRadius='0.5em' overflowX='auto'>
        <Heading style={{ paddingBottom: '0.25em' }}>List Events</Heading>
        <NumberedText number={3} text={'Preview layout'} />
        <div className={styles.content}>
          <PreviewContainer data={selectedData} />
        </div>
      </Box>
    </SimpleGrid>
  );
}
