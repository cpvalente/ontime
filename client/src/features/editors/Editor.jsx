import { Box } from '@chakra-ui/layout';
import PlaybackControl from '../control/PlaybackControl';
import MessageControl from '../control/MessageControl';
import styles from './Editor.module.css';
import EventListWrapper from './list/EventListWrapper';
import { useDisclosure } from '@chakra-ui/hooks';
import SettingsModal from '../modals/SettingsModal';
import { useEffect } from 'react';
import MenuBar from 'features/menu/MenuBar';

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
        <Box id='settings' className={styles.settings}>
          <MenuBar onOpen={onOpen} />
        </Box>

        <Box className={styles.editor}>
          <h1>Event List</h1>
          <div className={styles.content}>
            <EventListWrapper />
          </div>
        </Box>

        <Box className={styles.messages}>
          <h1>Display Messages</h1>
          <div className={styles.content}>
            <MessageControl />
          </div>
        </Box>

        <Box className={styles.playback}>
          <h1>Timer Control</h1>
          <div className={styles.content}>
            <PlaybackControl />
          </div>
        </Box>

        <Box className={styles.info} borderRadius='0.5em' overflowX='auto'>
          <h1>Info</h1>
          <div className={styles.content}></div>
        </Box>
      </div>
    </>
  );
}
