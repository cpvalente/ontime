import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { EntryId, OntimeEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { useCurrentBlockId } from '../../../../common/hooks/useSocket';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './BlockRow.module.scss';

interface BlockRowProps {
  blockId: EntryId;
  colour: string;
  hidePast: boolean;
  rowId: string;
  rowIndex: number;
  table: Table<OntimeEntry>;
}

export default function BlockRow({ blockId, colour, hidePast, rowId, rowIndex, table }: BlockRowProps) {
  const { currentBlockId } = useCurrentBlockId();

  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
  const showActionMenu = usePersistedCuesheetOptions((state) => state.showActionMenu);
  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  if (hidePast && !currentBlockId) {
    return null;
  }

  return (
    <tr className={style.blockRow} style={{ '--user-bg': colour }}>
      {showActionMenu && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            variant='subtle-white'
            size='small'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, blockId, rowIndex);
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
