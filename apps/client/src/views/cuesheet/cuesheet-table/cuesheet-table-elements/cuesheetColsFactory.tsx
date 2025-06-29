import { useCallback } from 'react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeDelay, isOntimeEvent, OntimeEntry, TimeStrategy } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import DelayIndicator from '../../../../common/components/delay-indicator/DelayIndicator';
import { formatDuration, formatTime } from '../../../../common/utils/time';

import DurationInput from './DurationInput';
import EditableImage from './EditableImage';
import MultiLineCell from './MultiLineCell';
import MutedText from './MutedText';
import SingleLineCell from './SingleLineCell';
import TimeInput from './TimeInput';

function MakeStart({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;
  const formatOpts = hideTableSeconds ? { format12: 'hh:mm a', format24: 'HH:mm' } : undefined;

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return <MutedText numeric>{formatTime(getValue() as number)}</MutedText>;
  }

  const { handleUpdateTimer } = table.options.meta;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeStart', newValue);

  const startTime = getValue() as number;
  const isStartLocked = !event.linkStart;

  const displayTime = showDelayedTimes ? startTime + event.delay : startTime;

  const formattedTime = formatTime(displayTime, formatOpts);

  return (
    <TimeInput initialValue={startTime} onSubmit={update} lockedValue={isStartLocked} delayed={event.delay !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(startTime)} />
    </TimeInput>
  );
}

function MakeEnd({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;
  const formatOpts = hideTableSeconds ? { format12: 'hh:mm a', format24: 'HH:mm' } : undefined;

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return <MutedText numeric>{formatTime(getValue() as number, formatOpts)}</MutedText>;
  }

  const { handleUpdateTimer } = table.options.meta;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeEnd', newValue);

  const endTime = getValue() as number;
  const isEndLocked = event.timeStrategy === TimeStrategy.LockEnd;

  const displayTime = showDelayedTimes ? endTime + event.delay : endTime;

  const formattedTime = formatTime(displayTime, formatOpts);

  return (
    <TimeInput initialValue={endTime} onSubmit={update} lockedValue={isEndLocked} delayed={event.delay !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(endTime)} />
    </TimeInput>
  );
}

function MakeDuration({ getValue, row, table }: CellContext<OntimeEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { hideTableSeconds } = table.options.meta.options;
  const event = row.original;
  if (!isOntimeEvent(event)) {
    return <MutedText numeric>{formatDuration(getValue() as number, hideTableSeconds)}</MutedText>;
  }

  const { handleUpdateTimer } = table.options.meta;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'duration', newValue);

  const duration = getValue() as number;
  const isDurationLocked = event.timeStrategy === TimeStrategy.LockDuration;
  const formattedDuration = formatDuration(duration, hideTableSeconds);

  return (
    <DurationInput initialValue={duration} onSubmit={update} lockedValue={isDurationLocked}>
      {formattedDuration}
    </DurationInput>
  );
}

function MakeMultiLineField({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, false);
    },
    [column.id, row.index, table.options.meta],
  );

  // not all entries have all properties (eg blocks)
  const initialValue = row.original[column.id as keyof OntimeEntry];
  if (initialValue === undefined) {
    return null;
  }

  return <MultiLineCell initialValue={initialValue as string} handleUpdate={update} />;
}

function LazyImage({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, true);
    },
    [column.id, row.index, table.options.meta],
  );

  const event = row.original;
  if (isOntimeDelay(event)) {
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
    [column.id, row.index, table.options.meta],
  );

  // not all entries have all properties (eg blocks)
  const initialValue = row.original[column.id as keyof OntimeEntry];
  if (initialValue === undefined) {
    return null;
  }

  return <SingleLineCell initialValue={initialValue as string} handleUpdate={update} />;
}

function MakeCustomField({ row, column, table }: CellContext<OntimeEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, true);
    },
    [column.id, row.index, table.options.meta],
  );

  const event = row.original;
  if (isOntimeDelay(event)) {
    return null;
  }

  // fields will not contain the field if there is no value set by the user
  // event if there is no initial value, we still render the cell
  const initialValue = event.custom[column.id] ?? '';
  return <MultiLineCell initialValue={initialValue} handleUpdate={update} />;
}

export function makeCuesheetColumns(customFields: CustomFields): ColumnDef<OntimeEntry>[] {
  /**
   * we cant use the createColumnHelper() because we have custom logic for rendering the cells
   * This means that the display columns: index and action are added inline by the row components
   */
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
