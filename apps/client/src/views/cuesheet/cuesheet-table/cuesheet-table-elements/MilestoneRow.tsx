import { IoEllipsisHorizontal } from 'react-icons/io5';
import { useSessionStorage } from '@mantine/hooks';
import { flexRender, Table } from '@tanstack/react-table';
import { EntryId, OntimeEntry, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { cx, enDash } from '../../../../common/utils/styleUtils';
import { AppMode, sessionKeys } from '../../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import { useCuesheetTableMenu } from '../cuesheet-table-menu/useCuesheetTableMenu';

import style from './MilestoneRow.module.scss';

interface MilestoneRowProps {
  entryId: EntryId;
  isPast: boolean;
  parentBgColour: string | null;
  parentId: EntryId | null;
  rowBgColour?: string;
  rowId: string;
  rowIndex: number;
  table: Table<OntimeEntry>;
}

export default function MilestoneRow({
  entryId,
  isPast,
  parentBgColour,
  parentId,
  rowBgColour,
  rowId,
  rowIndex,
  table,
}: MilestoneRowProps) {
  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
  const [cuesheetMode] = useSessionStorage<AppMode>({
    key: sessionKeys.cuesheetMode,
    defaultValue: AppMode.Edit,
  });
  const openMenu = useCuesheetTableMenu((store) => store.openMenu);

  return (
    <tr
      className={cx([style.milestoneRow, Boolean(parentBgColour) && style.hasParent])}
      style={{
        opacity: `${isPast ? '0.2' : '1'}`,
        '--user-bg': parentBgColour ?? 'transparent',
      }}
      data-testid='cuesheet-milestone'
    >
      {cuesheetMode === AppMode.Edit && (
        <td className={style.actionColumn} tabIndex={-1} role='cell'>
          <IconButton
            aria-label='Options'
            variant='subtle-white'
            size='small'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const yPos = 8 + rect.y + rect.height / 2;
              openMenu({ x: rect.x, y: yPos }, entryId, SupportedEntry.Milestone, rowIndex, parentId);
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
              }}
              tabIndex={-1}
              role='cell'
            >
              {canRender && flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
    </tr>
  );
}
