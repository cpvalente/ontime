import { useCallback } from 'react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeEvent, OntimeEvent, OntimeRundownEntry, TimeStrategy } from 'ontime-types';
import { millisToString, removeSeconds } from 'ontime-utils';

import DelayIndicator from '../../../../common/components/delay-indicator/DelayIndicator';
import { formatDuration } from '../../../../common/utils/time';

import MultiLineCell from './MultiLineCell';
import SingleLineCell from './SingleLineCell';
import TimeInput from './TimeInput';

function MakeStart({ getValue, row, table }: CellContext<OntimeRundownEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;
  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeStart', newValue);

  const startTime = getValue() as number;
  const isStartLocked = (row.original as OntimeEvent).linkStart === null;
  const delayValue = (row.original as OntimeEvent)?.delay ?? 0;

  const displayTime = showDelayedTimes ? startTime + delayValue : startTime;
  let formattedTime = millisToString(displayTime);
  if (hideTableSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return (
    <TimeInput initialValue={startTime} onSubmit={update} lockedValue={isStartLocked} delayed={delayValue !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={delayValue} tooltipPrefix={millisToString(startTime)} />
    </TimeInput>
  );
}

function MakeEnd({ getValue, row, table }: CellContext<OntimeRundownEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;
  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeEnd', newValue);

  const endTime = getValue() as number;
  const isEndLocked = (row.original as OntimeEvent).timeStrategy === TimeStrategy.LockEnd;
  const delayValue = (row.original as OntimeEvent)?.delay ?? 0;

  const displayTime = showDelayedTimes ? endTime + delayValue : endTime;
  let formattedTime = millisToString(displayTime);
  if (hideTableSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return (
    <TimeInput initialValue={endTime} onSubmit={update} lockedValue={isEndLocked} delayed={delayValue !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={delayValue} tooltipPrefix={millisToString(endTime)} />
    </TimeInput>
  );
}

function MakeDuration({ getValue, row, table }: CellContext<OntimeRundownEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { handleUpdateTimer } = table.options.meta;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'duration', newValue);

  const duration = getValue() as number;
  const isDurationLocked = (row.original as OntimeEvent).timeStrategy === TimeStrategy.LockDuration;
  const formattedDuration = formatDuration(duration, false);

  return (
    <TimeInput initialValue={duration} onSubmit={update} lockedValue={isDurationLocked}>
      {formattedDuration}
    </TimeInput>
  );
}

function MakeMultiLineField({ row, column, table }: CellContext<OntimeRundownEntry, unknown>) {
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

  const initialValue = event[column.id as keyof OntimeRundownEntry] ?? '';

  return <MultiLineCell initialValue={initialValue} handleUpdate={update} />;
}

function MakeSingleLineField({ row, column, table }: CellContext<OntimeRundownEntry, unknown>) {
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

  const initialValue = event[column.id as keyof OntimeRundownEntry] ?? '';

  return <SingleLineCell initialValue={initialValue} handleUpdate={update} />;
}

function MakeCustomField({ row, column, table }: CellContext<OntimeRundownEntry, unknown>) {
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

export function makeCuesheetColumns(customFields: CustomFields): ColumnDef<OntimeRundownEntry>[] {
  const dynamicCustomFields = Object.keys(customFields).map((key) => ({
    accessorKey: key,
    id: key,
    header: customFields[key].label,
    meta: { colour: customFields[key].colour },
    cell: MakeCustomField,
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
