import { memo } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { cx } from '../../common/utils/styleUtils';
import { useEventSelection } from '../../features/rundown/useEventSelection';

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
  const { clearSelectedEvents, selectedEvents } = useEventSelection();

  const editorStyle = cx([
    style.eventEditor,
    selectedEvents.size > 1 || selectedEvents.size === 0 ? style.noEvent : null,
  ]);
  const removeOpenEvent = () => clearSelectedEvents();

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
