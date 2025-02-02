import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

interface EditorVisibilityOptions {
  isLockable?: boolean;
}

export default function useViewEditor({ isLockable }: EditorVisibilityOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const isViewLocked = useMemo(() => {
    if (!isLockable) {
      return false;
    }
    return isStringBoolean(searchParams.get('locked'));
  }, [isLockable, searchParams]);

  return { showEditFormDrawer, isViewLocked };
}
