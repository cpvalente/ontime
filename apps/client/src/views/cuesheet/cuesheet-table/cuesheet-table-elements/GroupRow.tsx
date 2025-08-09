import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { EntryId, OntimeEntry, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { useCurrentGroupId } from '../../../../common/hooks/useSocket';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './GroupRow.module.scss';

interface GroupRowProps {
  groupId: EntryId;
  colour: string;
  hidePast: boolean;
  rowId: string;
  rowIndex: number;
  table: Table<OntimeEntry>;
}

export default function GroupRow({ groupId, colour, hidePast, rowId, rowIndex, table }: GroupRowProps) {
  const { currentGroupId } = useCurrentGroupId();

  const { cuesheetMode, hideIndexColumn } = table.options.meta?.options ?? {
    cuesheetMode: AppMode.Edit,
    hideIndexColumn: false,
  };

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  if (hidePast && !currentGroupId) {
    return null;
  }

  return (
    <tr className={style.groupRow} style={{ '--user-bg': colour }} data-testid='cuesheet-group'>
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
