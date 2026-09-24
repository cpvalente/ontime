import { memo, useEffect } from 'react';

import Modal from '../../../common/components/modal/Modal';
import { useRundownScope } from '../../../common/context/RundownScopeContext';
import useRundown from '../../../common/hooks-query/useRundown';
import CuesheetEntryEditor from '../../../features/rundown/entry-editor/CuesheetEventEditor';
import { useEditModal } from './useEditModal';

export default memo(EntryEditModal);
function EntryEditModal() {
  const { rundownId } = useRundownScope();
  const { data: rundown } = useRundown();
  const entryId = useEditModal((state) => state.selectedEntryId);
  const selectedRundownId = useEditModal((state) => state.selectedRundownId);
  const closeModal = useEditModal((state) => state.clearSelection);

  const isOpen = entryId !== null && selectedRundownId === rundownId;

  // the scope moved to another rundown while the modal was open
  useEffect(() => {
    if (entryId !== null && !isOpen) closeModal();
  }, [entryId, isOpen, closeModal]);

  if (!isOpen) {
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
