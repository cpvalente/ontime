import { memo, MutableRefObject, useLayoutEffect, useRef } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { flexRender, Table } from '@tanstack/react-table';
import { OntimeEntry, OntimeEvent, RGBColour } from 'ontime-types';
import { colourToHex, cssOrHexToColour } from 'ontime-utils';

import IconButton from '../../../../common/components/buttons/IconButton';
import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import { useVisibleRowsStore } from './visibleRowsStore';

import style from './EventRow.module.scss';

interface EventRowProps {
  rowId: string;
  event: OntimeEvent;
  eventIndex: number;
  rowIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
  rowBgColour?: string;
  parentBgColour?: string;
  table: Table<OntimeEntry>;
  /** hack to force re-rendering of the row when the column sizes change */
  columnHash: string;
  observer: IntersectionObserver;
  firstAfterBlock: boolean;
}

export default memo(EventRow, (prevProps, nextProps) => {
  return (
    prevProps.rowId === nextProps.rowId &&
    prevProps.event.revision === nextProps.event.revision &&
    prevProps.eventIndex === nextProps.eventIndex &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.isPast === nextProps.isPast &&
    prevProps.selectedRef === nextProps.selectedRef &&
    prevProps.rowBgColour === nextProps.rowBgColour &&
    prevProps.parentBgColour === nextProps.parentBgColour &&
    prevProps.columnHash === nextProps.columnHash
  );
});

function EventRow({
  rowId,
  event,
  eventIndex,
  rowIndex,
  isPast,
  selectedRef,
  rowBgColour,
  parentBgColour,
  table,
  observer,
  firstAfterBlock,
}: EventRowProps) {
  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
  const showActionMenu = usePersistedCuesheetOptions((state) => state.showActionMenu);
  const ownRef = useRef<HTMLTableRowElement>(null);

  const isVisible = useVisibleRowsStore((state) => state.visibleRows.has(rowId));

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  // store a reference of the row in the observer
  useLayoutEffect(() => {
    const handleRefCurrent = ownRef.current;
    if (handleRefCurrent) {
      observer.observe(handleRefCurrent);
    }

    return () => {
      if (handleRefCurrent) {
        observer.unobserve(handleRefCurrent);
      }
    };
  }, [observer]);

  const { color, backgroundColor } = getAccessibleColour(event.colour);
  const tmpColour = cssOrHexToColour(color) as RGBColour; // we know this to be a correct colour
  const mutedText = colourToHex({ ...tmpColour, alpha: tmpColour.alpha * 0.8 });

  return (
    <tr
      id={rowId}
      className={cx([style.eventRow, event.skip && style.skip, firstAfterBlock && style.firstAfterBlock, Boolean(parentBgColour) && style.hasParent])}
      style={{
        opacity: `${isPast ? '0.2' : '1'}`,
        '--user-bg': parentBgColour ?? 'transparent',
      }}
      ref={selectedRef ?? ownRef}
    >
      {showActionMenu && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            variant='subtle-white'
            size='small'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, event.id, rowIndex);
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
      {isVisible
        ? table
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
            })
        : null}
    </tr>
  );
}
