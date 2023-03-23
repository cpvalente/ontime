import { Box, IconButton } from '@chakra-ui/react';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { useAtom } from 'jotai';

import { editorEventId } from '../../common/atoms/LocalEventSettings';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';

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
        <div className={style.eventEditorLayout}>
          <EventEditor />
          <div className={style.header}>
            <IconButton aria-label='Close Menu' icon={<FiX />} onClick={() => setOpenId(null)} {...closeBtnStyle} />
          </div>
        </div>
      </ErrorBoundary>
    </Box>
  );
}
