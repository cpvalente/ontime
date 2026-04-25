import { memo } from 'react';
import { Rundown } from 'ontime-types';

import Modal from '../../../common/components/modal/Modal';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';
import { useEditModal } from './useEditModal';

interface EntryEditModalProps {
  rundown: Rundown;
}

export default memo(EntryEditModal);
function EntryEditModal({ rundown }: EntryEditModalProps) {
  const entryId = useEditModal((state) => state.selectedEntryId);
  const closeModal = useEditModal((state) => state.clearSelection);

  if (entryId === null) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={closeModal}
      title='Edit entry'
      showCloseButton
      bodyElements={<CuesheetEntryEditor entryId={entryId} rundown={rundown} />}
    />
  );
}
