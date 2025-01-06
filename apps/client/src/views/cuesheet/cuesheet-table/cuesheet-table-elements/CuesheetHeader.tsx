import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { useCuesheetOptions } from '../../cuesheet.options';

import { SortableCell } from './SortableCell';

import style from '../CuesheetTable.module.scss';

interface CuesheetHeaderProps {
  headerGroups: HeaderGroup<OntimeRundownEntry>[];
}

export default function CuesheetHeader(props: CuesheetHeaderProps) {
  const { headerGroups } = props;
  const { hideIndexColumn, showActionMenu } = useCuesheetOptions();

  return (
    <thead className={style.tableHeader}>
      {headerGroups.map((headerGroup) => {
        const key = headerGroup.id;

        return (
          <tr key={headerGroup.id}>
            {showActionMenu && <th className={style.actionColumn} />}
            {!hideIndexColumn && <th className={style.indexColumn}>#</th>}
            <SortableContext key={key} items={headerGroup.headers} strategy={horizontalListSortingStrategy}>
              {headerGroup.headers.map((header) => {
                const width = header.getSize();
                // @ts-expect-error -- we inject this into react-table
                const customBackground = header.column.columnDef?.meta?.colour;

                let customStyles = {};
                if (customBackground) {
                  const customColour = getAccessibleColour(customBackground);
                  customStyles = { backgroundColor: customColour.backgroundColor, color: customColour.color };
                }

                return (
                  <SortableCell key={header.column.columnDef.id} header={header} style={{ width, ...customStyles }}>
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
