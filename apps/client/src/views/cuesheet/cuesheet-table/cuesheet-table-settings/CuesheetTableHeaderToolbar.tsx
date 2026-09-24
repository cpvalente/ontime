import { Popover } from '@base-ui/react/popover';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { ReactNode } from 'react';
import { IoChevronDown, IoOptions } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import Checkbox from '../../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import PopoverContents from '../../../../common/components/popover/Popover';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetPermissions } from '../../useTablePermissions';
import type { CuesheetColumn } from '../cuesheetTable.features';
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
  columns: CuesheetColumn[];
  optionsStore: TableHeaderOptionsStore;
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
  insertElement?: ReactNode;
  modeControls?: TableModeControls;
  showShare?: boolean;
}

export default function CuesheetTableHeaderToolbar({
  columns,
  optionsStore,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
  insertElement,
  modeControls,
  showShare = false,
}: CuesheetTableHeaderToolbarProps) {
  const canChangeMode = useCuesheetPermissions((state) => state.canChangeMode);
  const canShare = useCuesheetPermissions((state) => state.canShare);

  const toggleCuesheetMode = (mode: AppMode[]) => {
    const newValue = mode.at(0);
    if (!newValue || !modeControls) return;
    modeControls.setCuesheetMode(newValue);
  };

  const isBackground = !(modeControls?.isCurrentRundown ?? true);

  return (
    <Toolbar.Root className={style.tableSettings} data-background-rundown={isBackground}>
      <TableSettings
        columns={columns}
        optionsStore={optionsStore}
        handleResetResizing={handleResetResizing}
        handleResetReordering={handleResetReordering}
        handleClearToggles={handleClearToggles}
        showShare={showShare && canShare}
      />
      {modeControls && canChangeMode && (
        <div className={style.apart}>
          {insertElement}
          <ToggleGroup
            value={[modeControls.cuesheetMode]}
            onValueChange={toggleCuesheetMode}
            className={style.group}
            disabled={!modeControls.isCurrentRundown}
          >
            <Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton}>
              Run
            </Toolbar.Button>
            <Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.radioButton}>
              Edit
            </Toolbar.Button>
          </ToggleGroup>
        </div>
      )}
    </Toolbar.Root>
  );
}

interface TableSettingsProps {
  columns: CuesheetColumn[];
  optionsStore: TableHeaderOptionsStore;
  handleResetResizing: () => void;
  handleResetReordering: () => void;
  handleClearToggles: () => void;
  showShare: boolean;
}

/** Single entry point for view options, column options and sharing, so the toolbar stays short on any screen size */
function TableSettings({
  columns,
  optionsStore,
  handleResetResizing,
  handleResetReordering,
  handleClearToggles,
  showShare,
}: TableSettingsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Toolbar.Button
            render={
              <Button variant='ghosted-white' aria-label='Options'>
                <IoOptions />
                <span className={style.optionsLabel}>Options</span>
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

        <div className={style.column}>
          <Editor.Label className={style.sectionTitle}>Column visibility</Editor.Label>
          {columns.map((column) => {
            const columnHeader = column.columnDef.header;
            const visible = column.getIsVisible();

            return (
              <Editor.Label key={`${column.id}-${visible}`} className={style.option}>
                <Checkbox defaultChecked={visible} onCheckedChange={(checked) => column.toggleVisibility(checked)} />
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
          {showShare && (
            <>
              <Editor.Separator orientation='horizontal' />
              <CuesheetShareModal />
            </>
          )}
        </div>
      </PopoverContents>
    </Popover.Root>
  );
}
