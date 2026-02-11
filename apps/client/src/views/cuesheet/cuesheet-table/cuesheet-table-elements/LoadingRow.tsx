import { CSSProperties } from 'react';
import { Table } from '@tanstack/react-table';
import { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { AppMode } from '../../../../ontimeConfig';
import style from './LoadingRow.module.scss';

interface LoadingRowProps {
  rowId: string;
  table: Table<ExtendedEntry>;
  injectedStyles?: CSSProperties;
}

export default function LoadingRow({ rowId, table, injectedStyles, ...virtuosoProps }: LoadingRowProps) {
  const { cuesheetMode, hideIndexColumn } = table.options.meta?.options ?? {
    cuesheetMode: AppMode.Edit,
    hideIndexColumn: false,
  };

  return (
    <tr
      className={style.loadingRow}
      style={injectedStyles}
      data-testid='loading-row'
      {...virtuosoProps}
    >
      {cuesheetMode === AppMode.Edit && <td className={style.actionColumn} />}
      {!hideIndexColumn && <td className={style.indexColumn} />}
      {table
        .getRow(rowId)
        .getVisibleCells()
        .map((cell) => {
          const isTitle = cell.column.id === 'title';
          return (
            <td
              key={cell.id}
              style={{
                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
              }}
              className={style.loadingCell}
            >
              {isTitle ? 'Loading...' : ''}
            </td>
          );
        })}
    </tr>
  );
}
