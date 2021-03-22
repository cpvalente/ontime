import { Flex, Text } from '@chakra-ui/layout';
import { Heading } from '@chakra-ui/layout';
import { SimpleGrid } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import NumberedText from '../../common/components/text/NumberedText';
import EventForm from '../form/EventForm';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventList from './list/EventList';

export default function Editor() {
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
          <EventList />
        </div>
      </Box>

      <Box className={styles.editor} borderRadius='0.5em'>
        <Heading>Event Details</Heading>
        <NumberedText number={2} text={'Click Save to send to screens'} />
        <div className={styles.content}>
          <EventForm />
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
