import { Button } from '@chakra-ui/button';
import { Heading } from '@chakra-ui/layout';
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

  useEffect(() => {
    const se = data.events.filter((d) => d.id === selectedEvent);

    if (se.length > 0) setSelectedData(se[0]);
  }, [data, selectedEvent]);

  return (
    <SimpleGrid
      minChildWidth='120px'
      spacing='40px'
      className={styles.mainContainer}
    >
      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading>List Events</Heading>
        <NumberedText number={1} text={'Select Event'} />
        <div className={styles.content}>
          <EventList
            data={data}
            selected={selectedEvent}
            setSelected={setSelectedEvent}
          />
          <div className={styles.buttons}>
            <Button colorScheme='teal'>Add Event</Button>
          </div>
        </div>
      </Box>

      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading>Event Details</Heading>
        <NumberedText number={2} text={'Click Save to send to screens'} />
        <div className={styles.content}>
          <EventForm data={selectedData} />
        </div>
      </Box>

      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading>List Events</Heading>
        <NumberedText number={3} text={'Preview changes in screens'} />
        <div className={styles.content}>
          <PreviewContainer />
        </div>
      </Box>
    </SimpleGrid>
  );
}
