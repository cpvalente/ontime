import { memo } from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';

import { RundownViewMode } from '../rundownViewMode';

import style from './RundownHeader.module.scss';

interface RundownSettingsProps {
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

export default memo(RundownSettings);
function RundownSettings({ viewMode, setViewMode }: RundownSettingsProps) {
  const toggleViewMode = (mode: RundownViewMode[]) => {
    const newValue = mode.at(0);
    if (!newValue) return;
    setViewMode(newValue);
  };

  return (
    <ToggleGroup value={[viewMode]} onValueChange={toggleViewMode} className={style.group}>
      <Toolbar.Button render={<Toggle />} value='list' className={style.radioButton}>
        List
      </Toolbar.Button>
      <Toolbar.Button render={<Toggle />} value='table' className={style.radioButton}>
        Table
      </Toolbar.Button>
    </ToggleGroup>
  );
}
