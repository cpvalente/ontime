import { memo } from 'react';

import Modal from '../../../common/components/modal/Modal';
import { useContextRundownEditModal } from '../../../common/hooks-query/useContextRundown';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';
import { useEditModal } from './useEditModal';

export default memo(EntryEditModal);
function EntryEditModal() {
  const { rundown } = useContextRundownEditModal();
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
