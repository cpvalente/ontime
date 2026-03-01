import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { memo } from 'react';

import { AppMode } from '../../../ontimeConfig';
import { RundownViewMode } from '../rundown.options';
import { useEditorFollowMode } from '../useEditorFollowMode';

import style from './RundownHeader.module.scss';

interface RundownHeaderMobileProps {
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

export default memo(RundownHeaderMobile);
function RundownHeaderMobile({ viewMode, setViewMode }: RundownHeaderMobileProps) {
  const { editorMode, setEditorMode } = useEditorFollowMode();

  const toggleAppMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setEditorMode(newValue);
  };

  const toggleViewMode = (mode: RundownViewMode[]) => {
    const newValue = mode.at(0);
    if (!newValue) return;
    setViewMode(newValue);
  };

  return (
    <Toolbar.Root className={style.header}>
      <ToggleGroup value={[editorMode]} onValueChange={toggleAppMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton}>
          Run
        </Toolbar.Button>

        <Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.radioButton}>
          Edit
        </Toolbar.Button>
      </ToggleGroup>

      <ToggleGroup value={[viewMode]} onValueChange={toggleViewMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={RundownViewMode.List} className={style.radioButton}>
          List
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={RundownViewMode.Table} className={style.radioButton}>
          Table
        </Toolbar.Button>
      </ToggleGroup>
    </Toolbar.Root>
  );
}
