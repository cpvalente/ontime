import { memo } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { useCurrentBlockId } from '../../../../common/hooks/useSocket';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './BlockRow.module.scss';

interface BlockRowProps {
  colour: string;
  hidePast: boolean;
  rowId: string;
  table: Table<OntimeEntry>;
}

//export default memo(BlockRow);

export default function BlockRow({ colour, hidePast, rowId, table }: BlockRowProps) {
  const { currentBlockId } = useCurrentBlockId();

  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
  const showActionMenu = usePersistedCuesheetOptions((state) => state.showActionMenu);
  // TODO: maybe we need a block menu as well?
  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  if (hidePast && !currentBlockId) {
    return null;
  }

  const { color } = getAccessibleColour(colour);

  return (
    <tr className={style.blockRow} style={{ '--user-bg': colour, '--user-color': color }}>
      {showActionMenu && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            variant='subtle-white'
            size='small'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              // TODO: solve index
              openMenu({ x: rect.x, y: yPos }, currentBlockId!, 1);
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
                width: cell.column.getSize(),
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
