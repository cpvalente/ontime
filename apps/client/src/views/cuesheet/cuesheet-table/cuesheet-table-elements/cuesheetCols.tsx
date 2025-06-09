import { useCallback } from 'react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeEvent, OntimeEntry, OntimeEvent, TimeStrategy } from 'ontime-types';
import { millisToString, removeSeconds } from 'ontime-utils';

import DelayIndicator from '../../../../common/components/delay-indicator/DelayIndicator';
import { formatDuration } from '../../../../common/utils/time';

import EditableImage from './EditableImage';
import MultiLineCell from './MultiLineCell';
import SingleLineCell from './SingleLineCell';
import TimeInput from './TimeInput';

function MakeStart({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;
  const { showDelayedTimes, hideTableSeconds, timeFormat } = table.options.meta.options;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeStart', newValue);

  const startTime = getValue() as number;
  const isStartLocked = !(row.original as OntimeEvent).linkStart;
  const delayValue = (row.original as OntimeEvent)?.delay ?? 0;

  const displayTime = showDelayedTimes ? startTime + delayValue : startTime;
  let formattedTime = millisToString(displayTime, { timeFormat });
  if (hideTableSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return (
    <TimeInput initialValue={startTime} onSubmit={update} lockedValue={isStartLocked} delayed={delayValue !== 0} timeFormat={timeFormat}>
      {formattedTime}
      <DelayIndicator delayValue={delayValue} tooltipPrefix={millisToString(startTime)} />
    </TimeInput>
  );
}

function MakeEnd({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;
  const { showDelayedTimes, hideTableSeconds, timeFormat } = table.options.meta.options;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeEnd', newValue);

  const endTime = getValue() as number;
  const isEndLocked = (row.original as OntimeEvent).timeStrategy === TimeStrategy.LockEnd;
  const delayValue = (row.original as OntimeEvent)?.delay ?? 0;

  const displayTime = showDelayedTimes ? endTime + delayValue : endTime;
  let formattedTime = millisToString(displayTime, { timeFormat });
  if (hideTableSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return (
    <TimeInput initialValue={endTime} onSubmit={update} lockedValue={isEndLocked} delayed={delayValue !== 0} timeFormat={timeFormat}>
      {formattedTime}
      <DelayIndicator delayValue={delayValue} tooltipPrefix={millisToString(endTime)} />
    </TimeInput>
  );
}

function MakeDuration({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;
  const { timeFormat } = table.options.meta.options;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'duration', newValue);

  const duration = getValue() as number;
  const isDurationLocked = (row.original as OntimeEvent).timeStrategy === TimeStrategy.LockDuration;
  const formattedDuration = formatDuration(duration, false);

  return (
    <TimeInput initialValue={duration} onSubmit={update} lockedValue={isDurationLocked} timeFormat={timeFormat}>
      {formattedDuration}
    </TimeInput>
  );
}

function MakeMultiLineField({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const initialValue = event[column.id as keyof OntimeEntry] ?? '';

  return <MultiLineCell initialValue={initialValue as string} handleUpdate={update} />;
}

function LazyImage({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const initialValue = event.custom[column.id];
  return <EditableImage initialValue={initialValue} updateValue={update} />;
}

function MakeSingleLineField({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const initialValue = event[column.id as keyof OntimeEntry] ?? '';

  return <SingleLineCell initialValue={initialValue as string} handleUpdate={update} />;
}

function MakeCustomField({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const initialValue = event.custom[column.id] ?? '';
  return <MultiLineCell initialValue={initialValue} handleUpdate={update} />;
}

export function makeCuesheetColumns(customFields: CustomFields): ColumnDef<OntimeEntry>[] {
  const dynamicCustomFields = Object.keys(customFields).map((key) => ({
    accessorKey: key,
    id: key,
    header: customFields[key].label,
    meta: { colour: customFields[key].colour, type: customFields[key].type },
    cell: customFields[key].type === 'string' ? MakeCustomField : LazyImage,
    size: 250,
    minSize: 75,
  }));

  return [
    {
      accessorKey: 'cue',
      id: 'cue',
      header: 'Cue',
      cell: MakeSingleLineField,
      size: 75,
      minSize: 40,
    },
    {
      accessorKey: 'timeStart',
      id: 'timeStart',
      header: 'Start',
      cell: MakeStart,
      size: 75,
      minSize: 75,
    },
    {
      accessorKey: 'timeEnd',
      id: 'timeEnd',
      header: 'End',
      cell: MakeEnd,
      size: 75,
      minSize: 75,
    },
    {
      accessorKey: 'duration',
      id: 'duration',
      header: 'Duration',
      cell: MakeDuration,
      size: 75,
      minSize: 75,
    },
    {
      accessorKey: 'title',
      id: 'title',
      header: 'Title',
      cell: MakeSingleLineField,
      size: 250,
      minSize: 75,
    },
    {
      accessorKey: 'note',
      id: 'note',
      header: 'Note',
      cell: MakeMultiLineField,
      size: 250,
      minSize: 75,
    },
    ...dynamicCustomFields,
  ];
}
