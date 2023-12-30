import { memo } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useAppMode } from '../../common/stores/appModeStore';
import { cx } from '../../common/utils/styleUtils';

import EventEditor from './EventEditor';

import style from './EventEditor.module.scss';

const EventEditorExport = () => {
  const editId = useAppMode((state) => state.editId);
  const setEditId = useAppMode((state) => state.setEditId);

  const editorStyle = cx([style.eventEditorContainer, !editId ? style.noEvent : null]);
  const removeOpenEvent = () => setEditId(null);

  return (
    <div className={editorStyle}>
      <ErrorBoundary>
        <div className={style.eventEditorLayout}>
          <EventEditor />
          <div className={style.header}>
            <IconButton
              aria-label='Close Menu'
              icon={<IoClose />}
              onClick={removeOpenEvent}
              variant='ontime-ghosted-white'
            />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default memo(EventEditorExport);
