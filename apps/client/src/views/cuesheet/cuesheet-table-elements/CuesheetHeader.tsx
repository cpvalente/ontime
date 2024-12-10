import {
  closestCorners,
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { getAccessibleColour } from '../../../common/utils/styleUtils';

import { SortableCell } from './SortableCell';

import style from '../Cuesheet.module.scss';

interface CuesheetHeaderProps {
  headerGroups: HeaderGroup<OntimeRundownEntry>[];
  saveColumnOrder: (fromId: string, toId: string) => void;
  showIndexColumn: boolean;
}

export default function CuesheetHeader(props: CuesheetHeaderProps) {
  const { headerGroups, saveColumnOrder, showIndexColumn } = props;

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { delta, active, over } = event;

    // cancel if delta y is greater than 200
    if (delta.y > 200) return;
    // cancel if we do not have an over id
    if (over?.id == null) return;

    saveColumnOrder(active.id as string, over.id as string);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 50,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 50,
      },
    }),
  );

  return (
    <thead className={style.tableHeader}>
      {headerGroups.map((headerGroup) => {
        const key = headerGroup.id;

        return (
          <DndContext key={key} sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleOnDragEnd}>
            <tr key={headerGroup.id}>
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
          </DndContext>
        );
      })}
    </thead>
  );
}
