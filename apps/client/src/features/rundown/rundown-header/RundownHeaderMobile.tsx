import { memo } from 'react';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { useSessionStorage } from '@mantine/hooks';
import { OffsetMode } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { setOffsetMode, useOffsetMode } from '../../../common/hooks/useSocket';
import { AppMode, sessionKeys } from '../../../ontimeConfig';

import style from './RundownHeader.module.scss';

export default memo(RundownHeader);
function RundownHeader() {
  const [editorMode, setEditorMode] = useSessionStorage<AppMode>({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });

  const { offsetMode } = useOffsetMode();

  const toggleAppMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setEditorMode(newValue);
  };

  const toggleOffsetMode = (mode: OffsetMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setOffsetMode(newValue);
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

      <Editor.Separator className={style.separator} />

      <ToggleGroup value={[offsetMode]} onValueChange={toggleOffsetMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Absolute} className={style.radioButton}>
          Absolute
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Relative} className={style.radioButton}>
          Relative
        </Toolbar.Button>
      </ToggleGroup>
    </Toolbar.Root>
  );
}
