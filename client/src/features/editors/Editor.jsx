import { Heading } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import NumberedText from 'common/components/text/NumberedText';
import PlaybackControl from '../control/PlaybackControl';
import MessageControl from '../control/MessageControl';
import styles from './Editor.module.css';
import EventListWrapper from './list/EventListWrapper';
import { useDisclosure } from '@chakra-ui/hooks';
import SettingsModal from '../modals/SettingsModal';
import SettingsIconBtn from 'common/components/buttons/SettingsIconBtn';
import { useEffect, useState } from 'react';
import DownloadIconBtn from 'common/components/buttons/DownloadIconBtn';
import { downloadEvents, uploadEvents } from 'app/api/ontimeApi';

export default function Editor() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [file, setFile] = useState(null);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  const handleDownload = () => {
    downloadEvents();
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    console.log('gonna upload', file);

    if (file && file.type === 'application/json') {
      if (file.size < 1048576) uploadEvents(file);
    }
  };

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={onClose} />

      <div className={styles.mainContainer}>
        <Box className={styles.editor}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Event List
          </Heading>
          <NumberedText number={1} text={'Manage events'} />
          <div className={styles.content}>
            <EventListWrapper />
          </div>
        </Box>

        <Box className={styles.messages}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Display Messages
          </Heading>
          <NumberedText
            number={3}
            text={'Show realtime messages on different screens'}
          />
          <div className={styles.content}>
            <MessageControl />
          </div>
        </Box>

        <Box className={styles.playback}>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Time Control
          </Heading>
          <NumberedText number={2} text={'Control timers'} />
          <div className={styles.content}>
            <PlaybackControl />
          </div>
        </Box>

        <Box className={styles.info} borderRadius='0.5em' overflowX='auto'>
          <Heading size='lg' paddingBottom={'0.25em'}>
            Info
          </Heading>
          <NumberedText number={4} text={'Running Info'} />
          <div className={styles.content}>
            <form id='uploaddb' onSubmit={handleUpload}>
              <input
                type='file'
                name='jsondb'
                accept='.json'
                onChange={handleFile}
              />
              <button className='submit-btn' type='submit'>
                Upload
              </button>
            </form>
          </div>
        </Box>

        <Box className={styles.settings}>
          <div className={styles.content}>
            <SettingsIconBtn size='md' clickhandler={onOpen} />
            <DownloadIconBtn size='md' clickhandler={handleDownload} />
          </div>
        </Box>
      </div>
    </>
  );
}
