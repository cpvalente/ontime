import { MaybeString, ProjectRundown } from 'ontime-types';
import { memo, use, useMemo } from 'react';

import Select from '../../common/components/select/Select';
import EmptyPage from '../../common/components/state/EmptyPage';
import { PresetContext } from '../../common/context/PresetContext';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import type { RundownSource } from '../../common/hooks-query/useScopedRundown';
import { AppMode } from '../../ontimeConfig';
import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { useApplyCuesheetPolicy } from './useApplyCuesheetPolicy';
import { FOLLOW_LOADED_RUNDOWN_ID } from './useCuesheetRundownSelection';

import styles from './CuesheetPage.module.scss';

interface CuesheetTableWrapperProps {
  source: RundownSource;
  selectedRundownId: MaybeString;
  loadedRundownId: string;
  setSelectedRundownId: (rundownId: string) => void;
  projectRundowns: ProjectRundown[];
}

export default memo(CuesheetTableWrapper);
function CuesheetTableWrapper({
  source,
  selectedRundownId,
  setSelectedRundownId,
  loadedRundownId,
  projectRundowns,
}: CuesheetTableWrapperProps) {
  const preset = use(PresetContext);
  const isCurrentRundown = source.rundownId !== null && source.rundownId === loadedRundownId;
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
          insertElement={
            <>
              <RundownSelect
                cuesheetMode={cuesheetMode}
                selectedRundownId={selectedRundownId}
                loadedRundownId={loadedRundownId}
                setSelectedRundownId={setSelectedRundownId}
                projectRundowns={projectRundowns}
              />
            </>
          }
        />
      )}
    </CuesheetDnd>
  );
}

interface RundownSelectProps {
  cuesheetMode: AppMode;
  selectedRundownId: MaybeString;
  loadedRundownId: string;
  setSelectedRundownId: (rundownId: string) => void;
  projectRundowns: ProjectRundown[];
}

function RundownSelect({ cuesheetMode, projectRundowns, selectedRundownId, setSelectedRundownId }: RundownSelectProps) {
  'use memo';
  const options = projectRundowns.map(({ id, title }) => ({
    value: id,
    label: title,
  }));
  options.unshift({
    value: FOLLOW_LOADED_RUNDOWN_ID,
    label: 'Follow loaded', // TODO: Better wording and maybe icon? and translation
  });

  return (
    <div className={styles.rundownSelect}>
      <Select
        value={selectedRundownId ?? undefined}
        options={options}
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
