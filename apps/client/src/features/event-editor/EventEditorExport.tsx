import { memo } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { FiX } from '@react-icons/all-files/fi/FiX';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { cx } from '../../common/utils/styleUtils';

import EventEditor from './EventEditor';

import style from '../editors/Editor.module.scss';

/* Styling for action buttons */
const closeBtnStyle = {
  size: 'md',
  variant: 'ghost',
  colorScheme: 'white',
  _hover: { bg: '#ebedf0', color: '#333' },
};

const EventEditorExport = () => {
  const appMode = useAppMode((state) => state.mode);
  const editId = useAppMode((state) => state.editId);
  const setEditId = useAppMode((state) => state.setEditId);

  const editorStyle = cx([style.eventEditor, !editId ? style.noEvent : null]);
  const removeOpenEvent = () => setEditId(null);
  const canRemoveOpenId = appMode === AppMode.Run;

  return (
    <Box className={editorStyle}>
      <ErrorBoundary>
        <div className={style.eventEditorLayout}>
          <EventEditor />
          <div className={style.header}>
            <IconButton
              aria-label='Close Menu'
              icon={<FiX />}
              onClick={removeOpenEvent}
              isDisabled={!canRemoveOpenId}
              {...closeBtnStyle}
            />
          </div>
        </div>
      </ErrorBoundary>
    </Box>
  );
};

export default memo(EventEditorExport);
