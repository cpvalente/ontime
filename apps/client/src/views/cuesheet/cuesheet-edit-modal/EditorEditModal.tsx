import { memo } from 'react';

import Modal from '../../../common/components/modal/Modal';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';

import { useEditorEditModal } from './useEditorEditModal';

export default memo(EditorEditModal);
function EditorEditModal() {
  const entryId = useEditorEditModal((state) => state.selectedEntryId);
  const closeModal = useEditorEditModal((state) => state.clearSelection);

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
