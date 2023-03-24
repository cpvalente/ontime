import { Box, IconButton } from '@chakra-ui/react';
import { FiX } from '@react-icons/all-files/fi/FiX';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useEventEditorStore } from '../../common/stores/eventEditor';

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
  const { openId, removeOpenEvent } = useEventEditorStore();

  return (
    <Box className={`${style.eventEditor} ${!openId ? style.noEvent : ''}`}>
      <ErrorBoundary>
        <div className={style.eventEditorLayout}>
          <EventEditor />
          <div className={style.header}>
            <IconButton aria-label='Close Menu' icon={<FiX />} onClick={removeOpenEvent} {...closeBtnStyle} />
          </div>
        </div>
      </ErrorBoundary>
    </Box>
  );
}
