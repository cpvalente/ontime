import { ReactNode, use } from 'react';
import { IoChevronDown, IoOptions, IoSettingsOutline } from 'react-icons/io5';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { useSessionStorage } from '@mantine/hooks';
import type { Column } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import Button from '../../../../common/components/buttons/Button';
import Checkbox from '../../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import PopoverContents from '../../../../common/components/popover/Popover';
import { PresetContext } from '../../../../common/context/PresetContext';
import { cx } from '../../../../common/utils/styleUtils';
import { AppMode, sessionKeys } from '../../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetPermissions } from '../../useTablePermissions';

import CuesheetShareModal from './CuesheetShareModal';

import style from './CuesheetTableSettings.module.scss';

interface CuesheetTableSettingsProps {
  columns: Column<OntimeEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

export default function CuesheetTableSettings({
  columns,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
}: CuesheetTableSettingsProps) {
  const canShare = useCuesheetPermissions((state) => state.canShare);
  const preset = use(PresetContext);

  const [cuesheetMode, setCuesheetMode] = useSessionStorage({
    key: preset ? `${preset.alias}${sessionKeys.cuesheetMode}` : sessionKeys.cuesheetMode,
    defaultValue: preset ? AppMode.Run : AppMode.Edit,
  });

  const toggleCuesheetMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setCuesheetMode(newValue);
  };

  return (
    <Toolbar.Root className={style.tableSettings}>
      <ViewSettings />
      <ColumnSettings
        columns={columns}
        handleResetResizing={handleResetResizing}
        handleResetReordering={handleResetReordering}
        handleClearToggles={handleClearToggles}
      />
      <ToggleGroup value={[cuesheetMode]} onValueChange={toggleCuesheetMode} className={cx([style.group, style.apart])}>
        <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton}>
          Run
        </Toolbar.Button>
        <Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.radioButton}>
          Edit
        </Toolbar.Button>
      </ToggleGroup>

      {canShare && (
        <>
          <Editor.Separator orientation='vertical' />
          <CuesheetShareModal />
        </>
      )}
    </Toolbar.Root>
  );
}

function ViewSettings() {
  const options = usePersistedCuesheetOptions();

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Toolbar.Button
            render={
              <Button variant='ghosted-white'>
                <IoSettingsOutline /> Settings
                <IoChevronDown />
              </Button>
            }
          />
        }
      />

      <PopoverContents align='start' className={style.inline}>
        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Element visibility</Editor.Label>
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
        </div>

        <div className={style.column}>
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
        </div>
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
          <Toolbar.Button
            render={
              <Button variant='ghosted-white'>
                <IoOptions /> View
                <IoChevronDown />
              </Button>
            }
          />
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
