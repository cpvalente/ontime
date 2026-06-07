import Select from '../../../../common/components/select/Select';
import { useRundownSelectionContext } from '../../../../common/context/RundownSelectionContext';
import { AppMode } from '../../../../ontimeConfig';

import styles from './RundownSelect.module.scss';

const FOLLOW = '___null___';

interface RundownSelectProps {
  cuesheetMode: AppMode;
}

export function RundownSelect({ cuesheetMode }: RundownSelectProps) {
  'use memo';
  const { selectRundownId, rundowns, loadedRundownId, selectedRundownId } = useRundownSelectionContext();

  const options = rundowns.map(({ id, title }) => ({
    value: id,
    label: loadedRundownId === id ? `${title} (loaded)` : title,
  }));

  // add a follow option
  options.unshift({
    value: FOLLOW,
    label: 'Follow loaded',
  });

  return (
    <div className={styles.rundownSelect}>
      <Select
        value={selectedRundownId ?? FOLLOW}
        options={options}
        onValueChange={(value) => {
          if (value === FOLLOW) selectRundownId(null);
          else selectRundownId(value);
        }}
        disabled={cuesheetMode === AppMode.Run}
        fluid
      />
    </div>
  );
}
