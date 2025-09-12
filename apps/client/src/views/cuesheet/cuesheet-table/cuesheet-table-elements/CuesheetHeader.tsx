import { CSSProperties } from 'react';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { flexRender, HeaderGroup } from '@tanstack/react-table';

import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode } from '../../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import { SortableCell } from './SortableCell';

import style from '../CuesheetTable.module.scss';

interface CuesheetHeaderProps {
  headerGroup: HeaderGroup<ExtendedEntry>;
  cuesheetMode: AppMode;
}

export default function CuesheetHeader({ headerGroup, cuesheetMode }: CuesheetHeaderProps) {
  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
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
              header={header}
              injectedStyles={{ width: `calc(var(--header-${header?.id}-size) * 1px)`, ...customStyles }}
            >
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </SortableCell>
          );
        })}
      </SortableContext>
    </tr>
  );
}
