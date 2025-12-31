import { memo } from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { useSessionStorage } from '@mantine/hooks';
import { OffsetMode } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { setOffsetMode, useOffsetMode } from '../../../common/hooks/useSocket';
import { AppMode, sessionKeys } from '../../../ontimeConfig';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

type RundownViewMode = 'list' | 'table';

interface RundownHeaderProps {
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

export default memo(RundownHeader);
function RundownHeader({ viewMode, setViewMode }: RundownHeaderProps) {
  const [editorMode, setEditorMode] = useSessionStorage({ key: sessionKeys.editorMode, defaultValue: AppMode.Edit });

  const offsetMode = useOffsetMode();

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

  const toggleViewMode = (mode: RundownViewMode[]) => {
    // we need to stop user from deselecting a mode
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

      <Editor.Separator className={style.separator} />

      <ToggleGroup value={[offsetMode]} onValueChange={toggleOffsetMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Absolute} className={style.radioButton}>
          Absolute
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={OffsetMode.Relative} className={style.radioButton}>
          Relative
        </Toolbar.Button>
      </ToggleGroup>

      <Editor.Separator className={style.separator} />

      <ToggleGroup value={[viewMode]} onValueChange={toggleViewMode} className={style.group}>
        <Toolbar.Button render={<Toggle />} value='list' className={style.radioButton}>
          List
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value='table' className={style.radioButton}>
          Table
        </Toolbar.Button>
      </ToggleGroup>

      <RundownMenu />
    </Toolbar.Root>
  );
}
