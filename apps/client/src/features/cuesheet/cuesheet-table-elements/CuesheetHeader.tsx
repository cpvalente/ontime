import { memo, useEffect } from 'react';
import { Tooltip } from '@chakra-ui/react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { OntimeRundownEntry } from 'ontime-types';

import { useLocalStorage } from '../../../common/hooks/useLocalStorage';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import { tooltipDelayFast } from '../../../ontimeConfig';
import { initialColumnOrder } from '../cuesheetCols';

import { SortableCell } from './SortableCell';

import style from '../Cuesheet.module.scss';

interface CuesheetHeaderProps {
  headerGroups: HeaderGroup<OntimeRundownEntry>[];
}

function CuesheetHeader(props: CuesheetHeaderProps) {
  const { headerGroups } = props;
  const [columnOrder, saveColumnOrder] = useLocalStorage<string[]>('table-order', initialColumnOrder);

  useEffect(() => {
    if (!localStorage.getItem('table-order')) {
      saveColumnOrder(initialColumnOrder);
    }
  }, [saveColumnOrder]);

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { delta, active, over } = event;

    // cancel if delta y is greater than 200
    if (delta.y > 200) return;
    // cancel if we do not have an over id
    if (over?.id == null) return;

    // get index of from
    const fromIndex = columnOrder.indexOf(active.id as string);

    // get index of to
    const toIndex = columnOrder.indexOf(over.id as string);

    if (toIndex === -1) {
      return;
    }

    const reorderedCols = [...columnOrder];
    const reorderedItem = reorderedCols.splice(fromIndex, 1);
    reorderedCols.splice(toIndex, 0, reorderedItem[0]);

    saveColumnOrder(reorderedCols);
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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <thead className={style.tableHeader}>
      {headerGroups.map((headerGroup) => {
        const key = headerGroup.id;

        return (
          <DndContext key={key} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
            <tr key={headerGroup.id}>
              <th className={style.indexColumn}>
                <Tooltip label='Event Order' openDelay={tooltipDelayFast}>
                  #
                </Tooltip>
              </th>
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

export default memo(CuesheetHeader);
