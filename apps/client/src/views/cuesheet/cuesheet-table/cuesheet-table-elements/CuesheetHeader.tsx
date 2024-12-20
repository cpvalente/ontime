import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';

import { SortableCell } from './SortableCell';

import style from '../CuesheetTable.module.scss';

interface CuesheetHeaderProps {
  headerGroups: HeaderGroup<OntimeRundownEntry>[];
  showIndexColumn: boolean;
}

export default function CuesheetHeader(props: CuesheetHeaderProps) {
  const { headerGroups, showIndexColumn } = props;

  return (
    <thead className={style.tableHeader}>
      {headerGroups.map((headerGroup) => {
        const key = headerGroup.id;

        return (
          <tr key={headerGroup.id}>
            <th className={style.actionColumn} />
            <th className={style.indexColumn}>{showIndexColumn && '#'}</th>
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
