import { memo } from 'react';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { OffsetMode } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { setOffsetMode, useOffsetMode } from '../../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import style from './RundownHeader.module.scss';

export default memo(RundownHeader);
function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);

  const { offsetMode } = useOffsetMode();

  const toggleAppMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setAppMode(newValue);
  };

  const toggleOffsetMode = (mode: OffsetMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setOffsetMode(newValue);
  };

  return (
    <Toolbar.Root className={style.header}>
      <ToggleGroup value={[appMode]} onValueChange={toggleAppMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.button}>
          Run
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.button}>
          Edit
        </Toolbar.Button>
      </ToggleGroup>

      <Editor.Separator className={style.separator} />

      <ToggleGroup value={[offsetMode]} onValueChange={toggleOffsetMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Absolute} className={style.button}>
          Absolute
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Relative} className={style.button}>
          Relative
        </Toolbar.Button>
      </ToggleGroup>
    </Toolbar.Root>
  );
}
