import { memo } from 'react';

import Modal from '../../../common/components/modal/Modal';
import useRundown from '../../../common/hooks-query/useRundown';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';
import { useEditModal } from './useEditModal';

export default memo(EntryEditModal);
function EntryEditModal() {
  const { data: rundown } = useRundown();
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
