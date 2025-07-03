import { memo, ReactNode } from 'react';
import { IoChevronDown, IoLocate, IoOptions, IoSettingsOutline } from 'react-icons/io5';
import { Popover } from '@base-ui-components/react/popover';
import type { Column } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import Button from '../../../../common/components/buttons/Button';
import Checkbox from '../../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import RotatedLink from '../../../../common/components/icons/RotatedLink';
import PopoverContents from '../../../../common/components/popover/Popover';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import style from './CuesheetTableSettings.module.scss';

interface CuesheetTableSettingsProps {
  columns: Column<OntimeEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export default memo(CuesheetTableSettings);
function CuesheetTableSettings({
  columns,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
}: CuesheetTableSettingsProps) {
  return (
    <div className={style.tableSettings}>
      <div className={style.inline}>
        <ViewSettings />
        <ColumnSettings
          columns={columns}
          handleResetResizing={handleResetResizing}
          handleResetReordering={handleResetReordering}
          handleClearToggles={handleClearToggles}
        />
      </div>

      <div className={style.inline}>
        <ViewSettingsFollowButton />

        <Editor.Separator orientation='vertical' />

        <Button variant='subtle'>
          <RotatedLink />
          Share...
        </Button>
      </div>
    </div>
  );
}

function ViewSettingsFollowButton() {
  const followPlayback = usePersistedCuesheetOptions((state) => state.followPlayback);
  const toggle = usePersistedCuesheetOptions((state) => state.toggleOption);

  return (
    <Button variant={followPlayback ? 'primary' : 'subtle'} onClick={() => toggle('followPlayback')}>
      <IoLocate />
      {followPlayback ? 'Following playback' : 'Follow playback'}
    </Button>
  );
}

function ViewSettings() {
  const options = usePersistedCuesheetOptions();

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button variant='ghosted-white'>
            <IoSettingsOutline /> Settings
            <IoChevronDown />
          </Button>
        }
      />

      <PopoverContents align='start' className={style.column}>
        <Editor.Label className={style.sectionTitle}>Element visibility</Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.showActionMenu}
            onCheckedChange={(checked) => options.setOption('showActionMenu', checked)}
          />
          Show action menu
        </Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.hideTableSeconds}
            onCheckedChange={(checked) => options.setOption('hideTableSeconds', checked)}
          />
          Hide seconds in table
        </Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.hidePast}
            onCheckedChange={(checked) => options.setOption('hidePast', checked)}
          />
          Hide past events
        </Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.hideIndexColumn}
            onCheckedChange={(checked) => options.setOption('hideIndexColumn', checked)}
          />
          Hide index column
        </Editor.Label>

        <Editor.Label className={style.sectionTitle}>Table Behaviour</Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.showDelayedTimes}
            onCheckedChange={(checked) => options.setOption('showDelayedTimes', checked)}
          />
          Show delayed times
        </Editor.Label>
        <Editor.Label className={style.option}>
          <Checkbox
            defaultChecked={options.hideDelays}
            onCheckedChange={(checked) => options.setOption('hideDelays', checked)}
          />
          Hide delay entries
        </Editor.Label>
      </PopoverContents>
    </Popover.Root>
  );
}

function ColumnSettings({
  columns,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
}: CuesheetTableSettingsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button variant='ghosted-white'>
            <IoOptions /> View
            <IoChevronDown />
          </Button>
        }
      />
      <PopoverContents align='start' className={style.inline}>
        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Column visibility</Editor.Label>
          {columns.map((column) => {
            const columnHeader = column.columnDef.header;
            const visible = column.getIsVisible();
            return (
              <Editor.Label key={`${column.id}-${visible}`} className={style.option}>
                <Checkbox defaultChecked={visible} onCheckedChange={column.toggleVisibility} />
                {columnHeader as ReactNode}
              </Editor.Label>
            );
          })}
        </div>
        <Editor.Separator orientation='vertical' />
        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Reset Options</Editor.Label>
          <Button size='small' fluid onClick={handleClearToggles}>
            Show All
          </Button>
          <Button size='small' fluid onClick={handleResetResizing}>
            Reset Resizing
          </Button>
          <Button size='small' fluid onClick={handleResetReordering}>
            Reset Reordering
          </Button>
        </div>
      </PopoverContents>
    </Popover.Root>
  );
}
