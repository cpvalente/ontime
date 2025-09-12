import { CSSProperties } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { EntryId, SupportedEntry } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import IconButton from '../../../../common/components/buttons/IconButton';
import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { cx, enDash, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './MilestoneRow.module.scss';

interface MilestoneRowProps {
  entryId: EntryId;
  isPast: boolean;
  parentBgColour?: string;
  parentId: EntryId | null;
  colour: string;
  rowId: string;
  rowIndex: number;
  table: Table<ExtendedEntry>;
  injectedStyles?: CSSProperties;
}

export default function MilestoneRow({
  entryId,
  isPast,
  parentBgColour,
  parentId,
  colour,
  rowId,
  rowIndex,
  table,
  injectedStyles,
  ...virtuosoProps
}: MilestoneRowProps) {
  const { cuesheetMode, hideIndexColumn } = table.options.meta?.options ?? {
    cuesheetMode: AppMode.Edit,
    hideIndexColumn: false,
  };

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  let rowBgColour: string | undefined;
  if (colour) {
    // the colour is user defined and might be invalid
    const accessibleBackgroundColor = cssOrHexToColour(getAccessibleColour(colour).backgroundColor);
    if (accessibleBackgroundColor !== null) {
      rowBgColour = colourToHex({
        ...accessibleBackgroundColor,
        alpha: accessibleBackgroundColor.alpha * 0.25,
      });
    }
  }

  return (
    <tr
      className={cx([style.milestoneRow, Boolean(parentBgColour) && style.hasParent])}
      style={{
        ...injectedStyles,
        opacity: `${isPast ? '0.2' : '1'}`,
        '--user-bg': parentBgColour ?? 'transparent',
      }}
      data-testid='cuesheet-milestone'
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
              openMenu({ x: rect.x, y: yPos }, entryId, SupportedEntry.Milestone, rowIndex, parentId, null);
            }}
          >
            <IoEllipsisHorizontal />
          </IconButton>
        </td>
      )}
      {!hideIndexColumn && (
        <td className={style.indexColumn} tabIndex={-1} role='cell'>
          {enDash}
        </td>
      )}
      {table
        .getRow(rowId)
        .getVisibleCells()
        .map((cell) => {
          const canRender =
            cell.column.id !== 'duration' && cell.column.id !== 'timeStart' && cell.column.id !== 'timeEnd';
          return (
            <td
              key={cell.id}
              style={{
                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                backgroundColor: rowBgColour,
                opacity: canRender ? 1 : 0.4,
              }}
              tabIndex={-1}
            >
              {canRender && flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
    </tr>
  );
}
