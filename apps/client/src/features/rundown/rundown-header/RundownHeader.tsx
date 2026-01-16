import { memo } from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { useSessionStorage } from '@mantine/hooks';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import { AppMode, sessionKeys } from '../../../ontimeConfig';
import { RundownViewMode } from '../rundownViewMode';

import RundownMenu from './RundownMenu';
import RundownSettings from './RundownSettings';

import style from './RundownHeader.module.scss';

interface RundownHeaderProps {
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

export default memo(RundownHeader);
function RundownHeader({ viewMode, setViewMode }: RundownHeaderProps) {
  const [editorMode, setEditorMode] = useSessionStorage({ key: sessionKeys.editorMode, defaultValue: AppMode.Edit });

  const toggleAppMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setEditorMode(newValue);
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

      <RundownSettings viewMode={viewMode} setViewMode={setViewMode} />

      <RundownMenu />
    </Toolbar.Root>
  );
}
