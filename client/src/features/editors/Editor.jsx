import { Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import NumberedText from '../../common/components/text/NumberedText';
import PlaybackControl from '../control/PlaybackControl';
import MessageControl from '../control/MessageControl';
import PreviewContainer from '../viewers/PreviewContainer';
import styles from './Editor.module.css';
import EventListWrapper from './list/EventListWrapper';
import { useDisclosure } from '@chakra-ui/hooks';
import SettingsModal from '../modals/SettingsModal';
import SettingsIconBtn from '../../common/components/buttons/SettingsIconBtn';
import { useEffect } from 'react';

export default function Editor() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={onClose} />

      <div className={styles.mainContainer}>
        <Box className={styles.editor}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Event List
          </Heading>
          <NumberedText number={1} text={'Manage and select event to run'} />
          <div className={styles.content}>
            <EventListWrapper />
          </div>
        </Box>

        <Box className={styles.messages}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Display Messages
          </Heading>
          <NumberedText
            number={2}
            text={'Show realtime messages on separate screen types'}
          />
          <div className={styles.content}>
            <MessageControl />
          </div>
        </Box>

        <Box className={styles.playback}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Time Control
          </Heading>
          <NumberedText number={3} text={'Control Timer'} />
          <div className={styles.content}>
            <PlaybackControl />
          </div>
        </Box>

        <Box className={styles.settings}>
          <div className={styles.content}>
            <SettingsIconBtn size='md' clickhandler={onOpen} />
          </div>
        </Box>

        <Box className={styles.info} borderRadius='0.5em' overflowX='auto'>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Info
          </Heading>
          <NumberedText number={4} text={'Running Info'} />
          <div className={styles.content}></div>
        </Box>
      </div>
    </>
  );
}
