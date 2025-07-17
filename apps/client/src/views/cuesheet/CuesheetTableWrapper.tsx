import { memo, useMemo } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import EmptyPage from '../../common/components/state/EmptyPage';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';

export default memo(CuesheetTableWrapper);
function CuesheetTableWrapper() {
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();

  const [cuesheetMode] = useSessionStorage({
    key: sessionKeys.cuesheetMode,
    defaultValue: AppMode.Edit,
  });
  const columns = useMemo(() => makeCuesheetColumns(customFields, cuesheetMode), [customFields, cuesheetMode]);
  const isLoading = !customFields || !flatRundown || rundownStatus === 'pending' || customFieldStatus === 'pending';

  return (
    <CuesheetDnd columns={columns}>
      {isLoading ? <EmptyPage text='Loading...' /> : <CuesheetTable data={flatRundown} columns={columns} />}
    </CuesheetDnd>
  );
}
