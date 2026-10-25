import { FlexRender } from '@tanstack/react-table';
import { OntimeMilestone, SupportedEntry } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';
import { CSSProperties, memo, useMemo } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import { cx, enDash, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';
import type { CuesheetColumn, CuesheetTable, CuesheetTableMeta } from '../cuesheetTable.features';

import style from './MilestoneRow.module.scss';

interface MilestoneRowProps {
  entry: OntimeMilestone;
  isPast: boolean;
  parentBgColour?: string;
  rowId: string;
  rowIndex: number;
  table: CuesheetTable;
  options: CuesheetTableMeta['options'];
  visibleColumns: CuesheetColumn[];
  injectedStyles?: CSSProperties;
  hasCursor?: boolean;
}

export default memo(MilestoneRow);
function MilestoneRow({
  entry,
  isPast,
  parentBgColour,
  rowId,
  rowIndex,
  table,
  options,
  visibleColumns,
  injectedStyles,
  hasCursor,
  ...virtuosoProps
}: MilestoneRowProps) {
  const { id: entryId, parent: parentId, colour } = entry;
  const { cuesheetMode, hideIndexColumn } = options;

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  const rowBgColour = useMemo(() => {
    if (!colour) return undefined;
    const accessibleBg = cssOrHexToColour(getAccessibleColour(colour).backgroundColor);
    if (accessibleBg === null) return undefined;
    return colourToHex({ ...accessibleBg, alpha: accessibleBg.alpha * 0.25 });
  }, [colour]);

  const cells = table.getRow(rowId).getAllCellsByColumnId();

  return (
    <tr
      className={cx([style.milestoneRow, Boolean(parentBgColour) && style.hasParent])}
      style={{
        ...injectedStyles,
        opacity: `${isPast ? '0.2' : '1'}`,
        '--user-bg': parentBgColour ?? 'transparent',
      }}
      data-testid='cuesheet-milestone'
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
      {visibleColumns.map((column) => {
        const cell = cells[column.id];
        const canRender = column.id !== 'duration' && column.id !== 'timeStart' && column.id !== 'timeEnd';
        return (
          <td
            key={cell.id}
            style={{
              width: `calc(var(--col-${column.id}-size) * 1px)`,
              backgroundColor: rowBgColour,
              opacity: canRender ? 1 : 0.4,
            }}
            tabIndex={-1}
          >
            {canRender && <FlexRender cell={cell} />}
          </td>
        );
      })}
    </tr>
  );
}
