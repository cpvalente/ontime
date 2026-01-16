import { memo } from 'react';
import { LuLayoutDashboard } from 'react-icons/lu';
import { Popover } from '@base-ui/react/popover';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { OffsetMode } from 'ontime-types';

import IconButton from '../../common/components/buttons/IconButton';
import * as Editor from '../../common/components/editor-utils/EditorUtils';
import PopoverContents from '../../common/components/popover/Popover';
import { setOffsetMode, useOffsetMode } from '../../common/hooks/useSocket';

import style from './EditorViewOptions.module.scss';

export default memo(EditorViewOptions);

function EditorViewOptions() {
  const offsetMode = useOffsetMode();

  const toggleOffsetMode = (mode: OffsetMode[]) => {
    const newValue = mode.at(0);
    if (!newValue) return;
    setOffsetMode(newValue);
  };

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <IconButton aria-label='View Options' variant='subtle-white' size='xlarge'>
            <LuLayoutDashboard />
          </IconButton>
        }
      />
      <PopoverContents title='View Options' className={style.popoverContent} align='end'>
        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Offset Mode</Editor.Label>
          <ToggleGroup value={[offsetMode]} onValueChange={toggleOffsetMode} className={style.group}>
            <Toggle value={OffsetMode.Absolute} className={style.radioButton}>
              Absolute
            </Toggle>
            <Toggle value={OffsetMode.Relative} className={style.radioButton}>
              Relative
            </Toggle>
          </ToggleGroup>
        </div>
      </PopoverContents>
    </Popover.Root>
  );
}
