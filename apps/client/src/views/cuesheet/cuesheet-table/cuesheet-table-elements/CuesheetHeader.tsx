import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useSessionStorage } from '@mantine/hooks';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { OntimeEntry } from 'ontime-types';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { AppMode, sessionKeys } from '../../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';

import { SortableCell } from './SortableCell';

import style from '../CuesheetTable.module.scss';

interface CuesheetHeaderProps {
  headerGroups: HeaderGroup<OntimeEntry>[];
}

export default function CuesheetHeader({ headerGroups }: CuesheetHeaderProps) {
  const hideIndexColumn = usePersistedCuesheetOptions((state) => state.hideIndexColumn);
  const [cuesheetMode] = useSessionStorage<AppMode>({
    key: sessionKeys.cuesheetMode,
    defaultValue: AppMode.Edit,
  });

  return (
    <thead className={style.tableHeader}>
      {headerGroups.map((headerGroup) => {
        const key = headerGroup.id;

        return (
          <tr key={headerGroup.id}>
            {cuesheetMode === AppMode.Edit && <th className={style.actionColumn} tabIndex={-1} />}
            {!hideIndexColumn && (
              <th className={style.indexColumn} tabIndex={-1}>
                #
              </th>
            )}
            <SortableContext key={key} items={headerGroup.headers} strategy={horizontalListSortingStrategy}>
              {headerGroup.headers.map((header) => {
                // @ts-expect-error -- we inject this into react-table
                const customBackground = header.column.columnDef?.meta?.colour;

                let customStyles = {};
                if (customBackground) {
                  const customColour = getAccessibleColour(customBackground);
                  customStyles = { backgroundColor: customColour.backgroundColor, color: customColour.color };
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
      })}
    </thead>
  );
}
