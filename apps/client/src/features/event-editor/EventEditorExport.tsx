import { memo } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useAppMode } from '../../common/stores/appModeStore';
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
  const editId = useAppMode((state) => state.idsToEdit);
  const { clearIdsToEdit } = useAppMode((state) => state);

  const editorStyle = cx([style.eventEditor, !editId ? style.noEvent : null]);
  const removeOpenEvent = () => clearIdsToEdit();

  return (
    <div className={editorStyle}>
      <ErrorBoundary>
        <div className={style.eventEditorLayout}>
          <EventEditor />
          <div className={style.header}>
            <IconButton aria-label='Close Menu' icon={<IoClose />} onClick={removeOpenEvent} {...closeBtnStyle} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default memo(EventEditorExport);
