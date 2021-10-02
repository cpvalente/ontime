import { lazy, useEffect } from 'react';
import { Box } from '@chakra-ui/layout';
import { useDisclosure } from '@chakra-ui/hooks';
import styles from './Editor.module.css';
import MenuBar from 'features/menu/MenuBar';
import ModalManager from 'features/modals/ModalManager';

const EventListWrapper = lazy(() =>
  import('features/editors/list/EventListWrapper')
);
const PlaybackControl = lazy(() => import('features/control/PlaybackControl'));
const MessageControl = lazy(() => import('features/control/MessageControl'));
const Info = lazy(() => import('features/info/Info'));

export default function Editor() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <>
      <ModalManager isOpen={isOpen} onClose={onClose} />

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

        <Box className={styles.info}>
          <h1>Info</h1>
          <div className={styles.content}>
            <Info />
          </div>
        </Box>
      </div>
    </>
  );
}
