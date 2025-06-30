import { memo } from 'react';

import Modal from '../../../common/components/modal/Modal';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';

import { useCuesheetEditModal } from './useCuesheetEditModal';

export default memo(CuesheetEditModal);
function CuesheetEditModal() {
  const entryId = useCuesheetEditModal((state) => state.selectedEntryId);
  const closeModal = useCuesheetEditModal((state) => state.clearSelection);

  if (entryId === null) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={closeModal}
      title='Edit entry'
      showCloseButton
      bodyElements={<CuesheetEntryEditor entryId={entryId} />}
    />
  );
}
