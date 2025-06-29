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
        <Popover.Root>
          <Popover.Trigger
            render={
              <Button variant='ghosted'>
                <IoSettingsOutline /> Settings
                <IoChevronDown />
              </Button>
            }
          />

          <PopoverContents align='start' className={style.column}>
            <Editor.Label className={style.sectionTitle}>Element visibility</Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Show action menu
            </Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Hide seconds in table
            </Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Hide past events
            </Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Hide index column
            </Editor.Label>

            <Editor.Label className={style.sectionTitle}>Table Behaviour</Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Show delayed times
            </Editor.Label>
            <Editor.Label className={style.option}>
              <Checkbox defaultChecked={false} onCheckedChange={console.log} />
              Show delay entries
            </Editor.Label>
          </PopoverContents>
        </Popover.Root>

        <Popover.Root>
          <Popover.Trigger
            render={
              <Button variant='ghosted'>
                <IoOptions /> View
                <IoChevronDown />
              </Button>
            }
          />
          <PopoverContents align='start' className={style.column}>
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
          </PopoverContents>
        </Popover.Root>
      </div>

      <div className={style.inline}>
        <Button>
          <IoLocate />
          Follow selected
        </Button>

        <Editor.Separator orientation='vertical' />

        <Button variant='primary'>
          <RotatedLink />
          Share...
        </Button>
      </div>
    </div>
  );
}
