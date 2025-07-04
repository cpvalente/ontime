import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { useViewParamsEditorStore } from '../view-params-editor/viewParamsEditor.store';

interface EditorVisibilityOptions {
  isLockable?: boolean;
}

export default function useViewEditor({ isLockable }: EditorVisibilityOptions) {
  const [searchParams] = useSearchParams();
  const { open: showEditFormDrawer } = useViewParamsEditorStore();

  const isViewLocked = useMemo(() => {
    if (!isLockable) {
      return false;
    }
    return isStringBoolean(searchParams.get('locked'));
  }, [isLockable, searchParams]);

  return { showEditFormDrawer, isViewLocked };
}
