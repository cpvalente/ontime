import { FlexRender } from '@tanstack/react-table';
import { OntimeEvent, RGBColour, SupportedEntry } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';
import { CSSProperties, memo, useMemo } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';
import type { CuesheetColumn, CuesheetTable, CuesheetTableMeta } from '../cuesheetTable.features';

import style from './EventRow.module.scss';

interface EventRowProps {
  entry: OntimeEvent;
  eventIndex: number;
  isFirstAfterGroup: boolean;
  isLoaded: boolean;
  isPast: boolean;
  groupColour: string | undefined;
  rowId: string;
  rowIndex: number;
  table: CuesheetTable;
  options: CuesheetTableMeta['options'];
  visibleColumns: CuesheetColumn[];
  injectedStyles?: CSSProperties;
  hasCursor?: boolean;
}

export default memo(EventRow);
function EventRow({
  entry,
  eventIndex,
  isFirstAfterGroup,
  isLoaded,
  isPast,
  groupColour,
  rowId,
  rowIndex,
  table,
  options,
  visibleColumns,
  injectedStyles,
  hasCursor,
  ...virtuosoProps
}: EventRowProps) {
  const { id, colour, flag, skip, parent } = entry;
  const { cuesheetMode, hideIndexColumn } = options;

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  const { rowBgColour, backgroundColor, mutedText } = useMemo(() => {
    const accessible = getAccessibleColour(colour);
    const tmpColour = cssOrHexToColour(accessible.color) as RGBColour;

    let rowBgColour: string | undefined;
    if (isLoaded) {
      rowBgColour = '#087A27'; // $active-green
    } else if (colour) {
      const accessibleBg = cssOrHexToColour(accessible.backgroundColor);
      if (accessibleBg !== null) {
        rowBgColour = colourToHex({ ...accessibleBg, alpha: accessibleBg.alpha * 0.25 });
      }
    }

    return {
      rowBgColour,
      backgroundColor: accessible.backgroundColor,
      mutedText: colourToHex({ ...tmpColour, alpha: tmpColour.alpha * 0.8 }),
    };
  }, [colour, isLoaded]);

  const cells = table.getRow(rowId).getAllCellsByColumnId();

  return (
    <tr
      id={rowId}
      className={cx([
        style.eventRow,
        skip && style.skip,
        isFirstAfterGroup && style.firstAfterGroup,
        parent && style.hasParent,
      ])}
      style={{
        ...injectedStyles,
        opacity: `${isPast ? '0.2' : '1'}`,
        '--user-bg': groupColour ?? 'transparent',
      }}
      data-cursor={hasCursor}
      data-testid='cuesheet-event'
      data-entry-id={id}
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
              openMenu({ x: rect.x, y: yPos }, id, SupportedEntry.Event, rowIndex, parent, flag);
            }}
          >
            <IoEllipsisHorizontal />
          </IconButton>
        </td>
      )}
      {!hideIndexColumn && (
        <td className={style.indexColumn} style={{ backgroundColor, color: mutedText }} tabIndex={-1} role='cell'>
          {eventIndex}
        </td>
      )}
      {visibleColumns.map((column) => {
        const cell = cells[column.id];
        return (
          <td
            key={cell.id}
            style={{
              width: `calc(var(--col-${column.id}-size) * 1px)`,
              backgroundColor: rowBgColour,
            }}
            tabIndex={-1}
            role='cell'
            data-testid={`cuesheet-cell-${column.id}`}
            data-column-id={column.id}
          >
            <FlexRender cell={cell} />
          </td>
        );
      })}
    </tr>
  );
}
