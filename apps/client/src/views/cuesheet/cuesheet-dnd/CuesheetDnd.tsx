import { PropsWithChildren } from 'react';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ColumnDef } from '@tanstack/react-table';

import type { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import useColumnManager from '../cuesheet-table/useColumnManager';

interface CuesheetDndProps {
  columns: ColumnDef<ExtendedEntry>[];
}

export default function CuesheetDnd({ columns, children }: PropsWithChildren<CuesheetDndProps>) {
  const { columnOrder, saveColumnOrder } = useColumnManager(columns);

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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleOnDragEnd}>
      {children}
    </DndContext>
  );
}
