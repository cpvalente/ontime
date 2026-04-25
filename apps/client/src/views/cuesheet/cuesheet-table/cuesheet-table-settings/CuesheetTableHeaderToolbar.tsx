import { Popover } from '@base-ui/react/popover';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import type { Column } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { IoBookOutline, IoChevronDown, IoOptions } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import Checkbox from '../../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import PopoverContents from '../../../../common/components/popover/Popover';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { cx } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetPermissions } from '../../useTablePermissions';
import CuesheetShareModal from './CuesheetShareModal';

import style from './CuesheetTableSettings.module.scss';

type TableHeaderOptionsStore = {
  hideTableSeconds: boolean;
  hideIndexColumn: boolean;
  showDelayedTimes: boolean;
  hideDelays: boolean;
  setOption: <K extends keyof TableHeaderOptionValues>(key: K, value: TableHeaderOptionValues[K]) => void;
};

type TableHeaderOptionValues = Pick<
  TableHeaderOptionsStore,
  'hideTableSeconds' | 'hideIndexColumn' | 'showDelayedTimes' | 'hideDelays'
>;

type TableModeControls = {
  cuesheetMode: AppMode;
  setCuesheetMode: (mode: AppMode) => void;
  isCurrentRundown?: boolean;
};

interface CuesheetTableHeaderToolbarProps {
  columns: Column<ExtendedEntry, unknown>[];
  optionsStore: TableHeaderOptionsStore;
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
  leadingContent?: ReactNode;
  modeControls?: TableModeControls;
  showShare?: boolean;
}

export default function CuesheetTableHeaderToolbar({
  columns,
  optionsStore,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
  leadingContent,
  modeControls,
  showShare = false,
}: CuesheetTableHeaderToolbarProps) {
  const canChangeMode = useCuesheetPermissions((state) => state.canChangeMode);
  const canShare = useCuesheetPermissions((state) => state.canShare);

  const toggleCuesheetMode = (mode: AppMode[]) => {
    const newValue = mode.at(0);
    if (!newValue || !modeControls) {
      return;
    }

    modeControls.setCuesheetMode(newValue);
  };

  return (
    <Toolbar.Root className={cx([style.tableSettings, modeControls?.isCurrentRundown === false && style.backgroundMode])}>
      {leadingContent}
      <ViewSettings optionsStore={optionsStore} />
      <ColumnSettings
        columns={columns}
        handleResetResizing={handleResetResizing}
        handleResetReordering={handleResetReordering}
        handleClearToggles={handleClearToggles}
      />
      {modeControls && canChangeMode && (
        <ToggleGroup
          value={[modeControls.cuesheetMode]}
          onValueChange={toggleCuesheetMode}
          className={cx([style.group, style.apart])}
        >
          {modeControls.isCurrentRundown === false ? (
            <Tooltip
              text='Run mode is only available for the loaded rundown'
              render={<span style={{ display: 'inline-block' }} />}
            >
              <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton} disabled>
                Run
              </Toolbar.Button>
            </Tooltip>
          ) : (
            <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton}>
              Run
            </Toolbar.Button>
          )}
          <Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.radioButton}>
            Edit
          </Toolbar.Button>
        </ToggleGroup>
      )}

      {showShare && canShare && (
        <>
          <Editor.Separator orientation='vertical' />
          <CuesheetShareModal />
        </>
      )}
    </Toolbar.Root>
  );
}

interface ViewSettingsProps {
  optionsStore: TableHeaderOptionsStore;
}

interface ColumnSettingsProps {
  columns: Column<ExtendedEntry, unknown>[];
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
}

function ViewSettings({ optionsStore }: ViewSettingsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Toolbar.Button
            render={
              <Button variant='ghosted-white'>
                <IoOptions /> Settings
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
              defaultChecked={optionsStore.hideTableSeconds}
              onCheckedChange={(checked) => optionsStore.setOption('hideTableSeconds', checked)}
            />
            Hide seconds in table
          </Editor.Label>
          <Editor.Label className={style.option}>
            <Checkbox
              defaultChecked={optionsStore.hideIndexColumn}
              onCheckedChange={(checked) => optionsStore.setOption('hideIndexColumn', checked)}
            />
            Hide index column
          </Editor.Label>
        </div>

        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Table Behaviour</Editor.Label>
          <Editor.Label className={style.option}>
            <Checkbox
              defaultChecked={optionsStore.showDelayedTimes}
              onCheckedChange={(checked) => optionsStore.setOption('showDelayedTimes', checked)}
            />
            Show delayed times
          </Editor.Label>
          <Editor.Label className={style.option}>
            <Checkbox
              defaultChecked={optionsStore.hideDelays}
              onCheckedChange={(checked) => optionsStore.setOption('hideDelays', checked)}
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
}: ColumnSettingsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Toolbar.Button
            render={
              <Button variant='ghosted-white'>
                <IoBookOutline /> Columns
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
