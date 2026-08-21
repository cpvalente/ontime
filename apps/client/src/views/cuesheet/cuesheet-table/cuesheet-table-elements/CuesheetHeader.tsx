import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { FlexRender } from '@tanstack/react-table';
import { CSSProperties } from 'react';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import type { CuesheetHeaderGroup } from '../cuesheetTable.features';
import { Draggable, SortableCell, TableCell } from './SortableCell';

import style from '../CuesheetTable.module.scss';

interface CuesheetHeaderProps {
  headerGroup: CuesheetHeaderGroup;
  cuesheetMode: AppMode;
  hideIndexColumn: boolean;
}

export function SortableCuesheetHeader({ headerGroup, cuesheetMode, hideIndexColumn }: CuesheetHeaderProps) {
  return (
    <tr key={headerGroup.id}>
      {cuesheetMode === AppMode.Edit && <th className={style.actionColumn} tabIndex={-1} />}
      {!hideIndexColumn && (
        <th className={style.indexColumn} tabIndex={-1}>
          #
        </th>
      )}
      <SortableContext key={headerGroup.id} items={headerGroup.headers} strategy={horizontalListSortingStrategy}>
        {headerGroup.headers.map((header) => {
          const customBackground = header.column.columnDef.meta?.colour;
          const canWrite = header.column.columnDef.meta?.canWrite;

          const customStyles: CSSProperties = {
            opacity: canWrite ? 1 : 0.6,
          };
          if (customBackground) {
            const customColour = getAccessibleColour(customBackground);
            customStyles.backgroundColor = customColour.backgroundColor;
            customStyles.color = customColour.color;
          }

          return (
            <SortableCell
              key={header.column.columnDef.id}
              columnId={header.column.id}
              colSpan={header.colSpan}
              injectedStyles={{ width: `calc(var(--header-${header?.id}-size) * 1px)`, ...customStyles }}
              draggable={<Draggable header={header} />}
            >
              {header.isPlaceholder ? null : <FlexRender header={header} />}
            </SortableCell>
          );
        })}
      </SortableContext>
    </tr>
  );
}

export function CuesheetHeader({ headerGroup, cuesheetMode, hideIndexColumn }: CuesheetHeaderProps) {
  return (
    <tr key={headerGroup.id}>
      {cuesheetMode === AppMode.Edit && <th className={style.actionColumn} tabIndex={-1} />}
      {!hideIndexColumn && (
        <th className={style.indexColumn} tabIndex={-1}>
          #
        </th>
      )}
      {headerGroup.headers.map((header) => {
        const customBackground = header.column.columnDef.meta?.colour;
        const canWrite = header.column.columnDef.meta?.canWrite;

        const customStyles: CSSProperties = {
          opacity: canWrite ? 1 : 0.6,
        };
        if (customBackground) {
          const customColour = getAccessibleColour(customBackground);
          customStyles.backgroundColor = customColour.backgroundColor;
          customStyles.color = customColour.color;
        }

        return (
          <TableCell
            key={header.column.columnDef.id}
            columnId={header.column.id}
            colSpan={header.colSpan}
            injectedStyles={{ width: `calc(var(--header-${header?.id}-size) * 1px)`, ...customStyles }}
            draggable={<Draggable header={header} />}
          >
            {header.isPlaceholder ? null : <FlexRender header={header} />}
          </TableCell>
        );
      })}
    </tr>
  );
}
