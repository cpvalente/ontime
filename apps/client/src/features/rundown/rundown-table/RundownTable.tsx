import { memo, useMemo } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import EmptyPage from '../../../common/components/state/EmptyPage';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { AppMode, sessionKeys } from '../../../ontimeConfig';
import CuesheetDnd from '../../../views/cuesheet/cuesheet-dnd/CuesheetDnd';
import CuesheetTable from '../../../views/cuesheet/cuesheet-table/CuesheetTable';

import { makeRundownColumns } from './makeRundownColumns';

export default memo(RundownTable);
function RundownTable() {
  const { data: customFields, status: customFieldStatus } = useCustomFields();

  const [editorMode] = useSessionStorage({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });

  const columns = useMemo(() => makeRundownColumns(customFields), [customFields]);

  const isLoading = !customFields || customFieldStatus === 'pending';

  return (
    <CuesheetDnd columns={columns} tableRoot='editor'>
      {isLoading ? (
        <EmptyPage text='Loading...' />
      ) : (
        <CuesheetTable columns={columns} cuesheetMode={editorMode} tableRoot='editor' />
      )}
    </CuesheetDnd>
  );
}
