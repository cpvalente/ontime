import { memo } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { cx } from '../../common/utils/styleUtils';
import { useEventSelection } from '../rundown/useEventSelection';

import EventEditor from './EventEditor';

import style from './EventEditor.module.scss';

const EventEditorExport = () => {
  const { clearSelectedEvents, selectedEvents } = useEventSelection();

  const editorStyle = cx([
    style.eventEditorContainer,
    selectedEvents.size > 1 || selectedEvents.size === 0 ? style.noEvent : null,
  ]);
  const removeOpenEvent = () => clearSelectedEvents();

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
