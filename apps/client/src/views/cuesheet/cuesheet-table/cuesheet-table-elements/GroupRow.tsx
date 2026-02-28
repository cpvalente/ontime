import { CSSProperties } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { Table, flexRender } from '@tanstack/react-table';
import { EntryId, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './GroupRow.module.scss';

interface GroupRowProps {
  groupId: EntryId;
  colour: string;
  rowId: string;
  rowIndex: number;
  table: Table<ExtendedEntry>;
  injectedStyles?: CSSProperties;
  hasCursor?: boolean;
}

export default function GroupRow({
  groupId,
  colour,
  rowId,
  rowIndex,
  table,
  injectedStyles,
  hasCursor,
  ...virtuosoProps
}: GroupRowProps) {
  const { cuesheetMode, hideIndexColumn } = table.options.meta?.options ?? {
    cuesheetMode: AppMode.Edit,
    hideIndexColumn: false,
  };

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  return (
    <tr
      className={style.groupRow}
      style={{ ...injectedStyles, '--user-bg': colour }}
      data-testid='cuesheet-group'
      data-cursor={hasCursor}
      {...virtuosoProps}
    >
      {cuesheetMode === AppMode.Edit && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            variant='ghosted-white'
            size='small'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, groupId, SupportedEntry.Group, rowIndex, null, null);
            }}
          >
            <IoEllipsisHorizontal />
          </IconButton>
        </td>
      )}
      {!hideIndexColumn && <td className={style.indexColumn} tabIndex={-1} role='cell' />}
      {table
        .getRow(rowId)
        .getVisibleCells()
        .map((cell) => {
          return (
            <td
              key={cell.id}
              tabIndex={-1}
              style={{
                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
              }}
              role='cell'
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
    </tr>
  );
}
