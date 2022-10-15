import { IconButton } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { editorEventId } from 'common/atoms/LocalEventSettings';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import { useAtom } from 'jotai';

import EventEditor from './EventEditor';

import style from '../editors/Editor.module.scss';

/* Styling for action buttons */
const closeBtnStyle = {
  size: 'md',
  variant: 'ghost',
  colorScheme: 'white',
  _hover: { bg: '#ebedf0', color: '#333' },
};

export default function InfoExport() {
  const [openId, setOpenId] = useAtom(editorEventId);

  return (
    <Box className={`${style.eventEditor} ${!openId ? style.noEvent : ''}`}>
      <ErrorBoundary>
        <div className={style.header}>
          <h1>Event Editor</h1>
          <IconButton
            aria-label='Close Menu'
            icon={<FiX />}
            onClick={() => setOpenId(null)}
            {...closeBtnStyle}
          />
        </div>
        <div className={style.content}>
          <EventEditor />
        </div>
      </ErrorBoundary>
    </Box>
  );
}
