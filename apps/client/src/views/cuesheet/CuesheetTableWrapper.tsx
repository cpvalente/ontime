import { memo, use, useEffect, useMemo } from 'react';
import { useSessionStorage } from '@mantine/hooks';

import EmptyPage from '../../common/components/state/EmptyPage';
import { PresetContext } from '../../common/context/PresetContext';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { sessionScope } from '../../externals';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { useCuesheetPermissions } from './useTablePermissions';

export default memo(CuesheetTableWrapper);
function CuesheetTableWrapper() {
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const setPermissions = useCuesheetPermissions((state) => state.setPermissions);
  const preset = use(PresetContext);

  // set permissions based on preset
  useEffect(() => {
    if (preset) {
      const fullWrite = preset.options?.write === 'full';
      setPermissions({
        canChangeMode: preset.options?.write !== '-',
        canCreateEntries: fullWrite,
        canEditEntries: fullWrite,
        canFlag: fullWrite || Boolean(preset.options?.write.includes('flag')),
        canShare: false, // TODO: should be sessionScope === 'rw' when we have granular scopes
      });
    } else {
      setPermissions({
        canChangeMode: true,
        canCreateEntries: true,
        canEditEntries: true,
        canFlag: true,
        canShare: sessionScope === 'rw',
      });
    }
  }, [preset, setPermissions]);

  const [cuesheetMode] = useSessionStorage({
    key: preset ? `${preset.alias}${sessionKeys.cuesheetMode}` : sessionKeys.cuesheetMode,
    defaultValue: preset ? AppMode.Run : AppMode.Edit,
  });

  const columns = useMemo(
    () => makeCuesheetColumns(customFields, cuesheetMode, preset),
    [customFields, cuesheetMode, preset],
  );

  const isLoading = !customFields || !flatRundown || rundownStatus === 'pending' || customFieldStatus === 'pending';

  return (
    <CuesheetDnd columns={columns}>
      {isLoading ? (
        <EmptyPage text='Loading...' />
      ) : (
        <CuesheetTable data={flatRundown} columns={columns} cuesheetMode={cuesheetMode} />
      )}
    </CuesheetDnd>
  );
}
