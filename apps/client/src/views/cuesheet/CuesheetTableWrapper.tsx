import { memo, use, useMemo } from 'react';

import Select from '../../common/components/select/Select';
import EmptyPage from '../../common/components/state/EmptyPage';
import { PresetContext } from '../../common/context/PresetContext';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import type { RundownSource } from '../../common/hooks-query/useRundownSource';
import { AppMode } from '../../ontimeConfig';
import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { useApplyCuesheetPolicy } from './useApplyCuesheetPolicy';
import { useCuesheetRundownSelection } from './useCuesheetRundownSelection';

import styles from './CuesheetPage.module.scss';

interface CuesheetTableWrapperProps {
  isCurrentRundown: boolean;
  source: RundownSource;
}

export default memo(CuesheetTableWrapper);
function CuesheetTableWrapper({ isCurrentRundown, source }: CuesheetTableWrapperProps) {
  const preset = use(PresetContext);
  const { cuesheetMode, setCuesheetMode } = useApplyCuesheetPolicy(preset, { canRunMode: isCurrentRundown });
  const { data: customFields, status: customFieldStatus } = useCustomFields();

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
          source={source}
          cuesheetMode={cuesheetMode}
          tableRoot='cuesheet'
          setCuesheetMode={setCuesheetMode}
          isCurrentRundown={isCurrentRundown}
          headerLeadingContent={
            <>
              <RundownSelect cuesheetMode={cuesheetMode} />
              {!isCurrentRundown && <span className={styles.backgroundBadge}>Background</span>}
            </>
          }
        />
      )}
    </CuesheetDnd>
  );
}

interface RundownSelectProps {
  cuesheetMode: AppMode;
}

function RundownSelect({ cuesheetMode }: RundownSelectProps) {
  const { projectRundowns, loadedRundownId, selectedRundownId, setSelectedRundownId } = useCuesheetRundownSelection();

  return (
    <div className={styles.rundownSelect}>
      <Select
        value={selectedRundownId ?? undefined}
        options={projectRundowns.map(({ id, title }) => ({
          value: id,
          label: id === loadedRundownId ? `${title} (Loaded)` : title,
        }))}
        onValueChange={(value) => {
          if (value) {
            setSelectedRundownId(value);
          }
        }}
        disabled={cuesheetMode === AppMode.Run}
        fluid
      />
    </div>
  );
}
