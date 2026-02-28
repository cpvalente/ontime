import { memo, use, useMemo } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import { PresetContext } from '../../common/context/PresetContext';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { useApplyCuesheetPolicy } from './useApplyCuesheetPolicy';

export default memo(CuesheetTableWrapper);
function CuesheetTableWrapper() {
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const preset = use(PresetContext);
  const { cuesheetMode, setCuesheetMode } = useApplyCuesheetPolicy(preset);

  const columns = useMemo(
    () => makeCuesheetColumns(customFields, cuesheetMode, preset),
    [customFields, cuesheetMode, preset],
  );

  const isLoading = !customFields || customFieldStatus === 'pending';

  return (
    <CuesheetDnd columns={columns}>
      {isLoading ? (
        <EmptyPage text='Loading...' />
      ) : (
        <CuesheetTable
          columns={columns}
          cuesheetMode={cuesheetMode}
          tableRoot='cuesheet'
          setCuesheetMode={setCuesheetMode}
        />
      )}
    </CuesheetDnd>
  );
}
