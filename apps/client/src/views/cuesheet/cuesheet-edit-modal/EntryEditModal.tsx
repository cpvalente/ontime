import { Rundown } from 'ontime-types';
import { memo } from 'react';

import Modal from '../../../common/components/modal/Modal';
import { useDisplayTimezone } from '../../../common/hooks/useDisplayTimezone';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';
import { useEditModal } from './useEditModal';

interface EntryEditModalProps {
  rundown: Rundown;
}

export default memo(EntryEditModal);
function EntryEditModal({ rundown }: EntryEditModalProps) {
  const entryId = useEditModal((state) => state.selectedEntryId);
  const closeModal = useEditModal((state) => state.clearSelection);
  const { timezoneDelta } = useDisplayTimezone();

  if (entryId === null) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={closeModal}
      title='Edit entry'
      showCloseButton
      bodyElements={<CuesheetEntryEditor entryId={entryId} rundown={rundown} timesLocked={timezoneDelta !== 0} />}
    />
  );
}
