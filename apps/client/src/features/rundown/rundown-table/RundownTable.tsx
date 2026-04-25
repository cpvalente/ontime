import { memo, useEffect, useMemo } from 'react';

import EmptyPage from '../../../common/components/state/EmptyPage';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { EntryActionsProvider } from '../../../common/context/EntryActionsContext';
import { useRundownSource } from '../../../common/hooks-query/useRundownSource';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import CuesheetDnd from '../../../views/cuesheet/cuesheet-dnd/CuesheetDnd';
import CuesheetTable from '../../../views/cuesheet/cuesheet-table/CuesheetTable';
import { useCuesheetPermissions } from '../../../views/cuesheet/useTablePermissions';
import { useEditorFollowMode } from '../useEditorFollowMode';
import { makeRundownColumns } from './makeRundownColumns';

export default memo(RundownTable);
function RundownTable() {
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const setPermissions = useCuesheetPermissions((state) => state.setPermissions);
  const { editorMode } = useEditorFollowMode();
  const source = useRundownSource(null);
  const actions = useEntryActions();

  // Editor always has full permissions
  useEffect(() => {
    setPermissions({
      canChangeMode: true,
      canCreateEntries: true,
      canEditEntries: true,
      canFlag: true,
      canShare: true,
    });
  }, [setPermissions]);

  const columns = useMemo(() => makeRundownColumns(customFields), [customFields]);

  const isLoading = !customFields || customFieldStatus === 'pending';

  return (
    <EntryActionsProvider actions={actions}>
      <CuesheetDnd columns={columns} tableRoot='editor'>
        {isLoading ? (
          <EmptyPage text='Loading...' />
        ) : (
          <CuesheetTable columns={columns} source={source} cuesheetMode={editorMode} tableRoot='editor' />
        )}
      </CuesheetDnd>
    </EntryActionsProvider>
  );
}
