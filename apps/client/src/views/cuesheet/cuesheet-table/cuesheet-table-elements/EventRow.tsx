import { memo, MutableRefObject, useLayoutEffect, useRef, useState } from 'react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { flexRender, Table } from '@tanstack/react-table';
import Color from 'color';
import { OntimeRundownEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { cx, getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from '../CuesheetTable.module.scss';

interface EventRowProps {
  rowId: string;
  eventId: string;
  eventIndex: number;
  rowIndex: number;
  isPast?: boolean;
  selectedRef?: MutableRefObject<HTMLTableRowElement | null>;
  skip?: boolean;
  colour?: string;
  rowBgColour?: string;
  table: Table<OntimeRundownEntry>;
  /** hack to force re-rendering of the row when the column sizes change */
  columnSizing: Record<string, number>;
}

export default memo(EventRow);

function EventRow(props: EventRowProps) {
  const { rowId, eventId, eventIndex, rowIndex, isPast, selectedRef, skip, colour, rowBgColour, table } = props;
  const { hideIndexColumn, showActionMenu } = useCuesheetOptions();
  const ownRef = useRef<HTMLTableRowElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null,
        threshold: 0.01,
      },
    );

    const handleRefCurrent = ownRef.current;
    if (selectedRef) {
      setIsVisible(true);
    } else if (handleRefCurrent) {
      observer.observe(handleRefCurrent);
    }

    return () => {
      if (handleRefCurrent) {
        observer.unobserve(handleRefCurrent);
      }
    };
  }, [ownRef, selectedRef]);

  const { color, backgroundColor } = getAccessibleColour(colour);
  const mutedText = Color(color).fade(0.4).hexa();

  return (
    <tr
      className={cx([style.eventRow, skip ?? style.skip])}
      style={{ opacity: `${isPast ? '0.2' : '1'}` }}
      ref={selectedRef ?? ownRef}
    >
      {showActionMenu && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, eventId, rowIndex);
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
            ?.getVisibleCells()
            .map((cell) => {
              return (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize(), backgroundColor: rowBgColour }}
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
