import { CSSProperties, useMemo } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { EntryId, OntimeEntry, RGBColour, SupportedEntry } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import IconButton from '../../../../common/components/buttons/IconButton';
import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './EventRow.module.scss';

interface EventRowProps {
  rowId: string;
  id: EntryId;
  eventIndex: number;
  colour: string;
  isFirstAfterGroup: boolean;
  isLoaded: boolean;
  isPast: boolean;
  groupColour: string | undefined;
  flag: boolean;
  skip: boolean;
  parent: EntryId | null;
  rowIndex: number;
  table: Table<ExtendedEntry<OntimeEntry>>;
  injectedStyles?: CSSProperties;
}

export default function EventRow({
  rowId,
  id,
  eventIndex,
  colour,
  isFirstAfterGroup,
  isLoaded,
  isPast,
  groupColour,
  flag,
  skip,
  parent,
  rowIndex,
  table,
  injectedStyles,
  ...virtuosoProps
}: EventRowProps) {
  const { cuesheetMode, hideIndexColumn } = table.options.meta?.options ?? {
    cuesheetMode: AppMode.Edit,
    hideIndexColumn: false,
  };

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  const { color, backgroundColor } = getAccessibleColour(colour);
  const tmpColour = cssOrHexToColour(color) as RGBColour; // we know this to be a correct colour
  const mutedText = colourToHex({ ...tmpColour, alpha: tmpColour.alpha * 0.8 });

  const rowBgColour: string | undefined = useMemo(() => {
    if (isLoaded) {
      return '#087A27'; // $active-green
    } else if (colour) {
      // the colour is user defined and might be invalid
      const accessibleBackgroundColor = cssOrHexToColour(getAccessibleColour(colour).backgroundColor);
      if (accessibleBackgroundColor !== null) {
        return colourToHex({
          ...accessibleBackgroundColor,
          alpha: accessibleBackgroundColor.alpha * 0.25,
        });
      }
    }
    return;
  }, [colour, isLoaded]);

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
      data-testid='cuesheet-event'
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
      {table
        .getRow(rowId)
        .getVisibleCells()
        .map((cell) => {
          return (
            <td
              key={cell.id}
              style={{
                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                backgroundColor: rowBgColour,
              }}
              tabIndex={-1}
              role='cell'
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
    </tr>
  );
}
