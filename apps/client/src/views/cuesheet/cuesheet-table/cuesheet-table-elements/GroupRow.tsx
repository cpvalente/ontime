import { FlexRender } from '@tanstack/react-table';
import { OntimeGroup, SupportedEntry } from 'ontime-types';
import { CSSProperties, memo } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';
import type { CuesheetColumn, CuesheetTable, CuesheetTableMeta } from '../cuesheetTable.features';

import style from './GroupRow.module.scss';

interface GroupRowProps {
  entry: OntimeGroup;
  rowId: string;
  rowIndex: number;
  table: CuesheetTable;
  options: CuesheetTableMeta['options'];
  visibleColumns: CuesheetColumn[];
  injectedStyles?: CSSProperties;
  hasCursor?: boolean;
}

export default memo(GroupRow);
function GroupRow({
  entry,
  rowId,
  rowIndex,
  table,
  options,
  visibleColumns,
  injectedStyles,
  hasCursor,
  ...virtuosoProps
}: GroupRowProps) {
  const { id: groupId, colour } = entry;
  const { cuesheetMode, hideIndexColumn } = options;

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);
  const cells = table.getRow(rowId).getAllCellsByColumnId();

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
      {visibleColumns.map((column) => {
        const cell = cells[column.id];
        return (
          <td
            key={cell.id}
            tabIndex={-1}
            style={{
              width: `calc(var(--col-${column.id}-size) * 1px)`,
            }}
            role='cell'
          >
            <FlexRender cell={cell} />
          </td>
        );
      })}
    </tr>
  );
}
