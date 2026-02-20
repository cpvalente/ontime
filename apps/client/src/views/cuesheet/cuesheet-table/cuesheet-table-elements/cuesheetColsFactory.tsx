import { useCallback } from 'react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeDelay, isOntimeEvent, TimeStrategy, URLPreset } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import DelayIndicator from '../../../../common/components/delay-indicator/DelayIndicator';
import type { ExtendedEntry } from '../../../../common/utils/rundownMetadata';
import { formatDuration, formatTime } from '../../../../common/utils/time';
import { AppMode } from '../../../../ontimeConfig';
import { getCuesheetColumnAccessPolicy } from '../../cuesheet.policies';

import DurationInput from './DurationInput';
import EditableImage from './EditableImage';
import FlagCell from './FlagCell';
import GhostedText from './GhostedText';
import MultiLineCell from './MultiLineCell';
import MutedText from './MutedText';
import SingleLineCell from './SingleLineCell';
import TimeInput from './TimeInput';

function getColumnLabel(column: CellContext<ExtendedEntry, unknown>['column']): string {
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
}

function MakeStart({ getValue, row, table, column }: CellContext<ExtendedEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;
  const formatOpts = hideTableSeconds ? { format12: 'h:mm a', format24: 'HH:mm' } : undefined;

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return <MutedText numeric>{formatTime(getValue() as number, formatOpts)}</MutedText>;
  }

  const { handleUpdateTimer } = table.options.meta;

  const update = (newValue: string) => handleUpdateTimer(row.original.id, 'timeStart', newValue);

  const startTime = getValue() as number;
  const isStartLocked = !event.linkStart;
  const displayTime = showDelayedTimes ? startTime + event.delay : startTime;
  const formattedTime = formatTime(displayTime, formatOpts);

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return (
      <MutedText numeric>
        {formattedTime}
        <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(startTime)} />
      </MutedText>
    );
  }
  return (
    <TimeInput initialValue={startTime} onSubmit={update} lockedValue={isStartLocked} delayed={event.delay !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(startTime)} />
    </TimeInput>
  );
}

function MakeEnd({ getValue, row, table, column }: CellContext<ExtendedEntry, unknown>) {
  if (!table.options.meta) {
    return null;
  }

  const { showDelayedTimes, hideTableSeconds } = table.options.meta.options;
  const formatOpts = hideTableSeconds ? { format12: 'h:mm a', format24: 'HH:mm' } : undefined;

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

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return (
      <MutedText numeric>
        {formattedTime}
        <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(endTime)} />
      </MutedText>
    );
  }

  return (
    <TimeInput initialValue={endTime} onSubmit={update} lockedValue={isEndLocked} delayed={event.delay !== 0}>
      {formattedTime}
      <DelayIndicator delayValue={event.delay} tooltipPrefix={millisToString(endTime)} />
    </TimeInput>
  );
}

function MakeDuration({ getValue, row, table, column }: CellContext<ExtendedEntry, unknown>) {
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

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return <MutedText numeric>{formattedDuration}</MutedText>;
  }

  return (
    <DurationInput initialValue={duration} onSubmit={update} lockedValue={isDurationLocked}>
      {formattedDuration}
    </DurationInput>
  );
}

function MakeMultiLineField({ row, column, table }: CellContext<ExtendedEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, false);
    },
    [column.id, row.index, table.options.meta],
  );

  // not all entries have all properties (eg groups)
  const initialValue = row.original[column.id as keyof ExtendedEntry];
  if (typeof initialValue !== 'string') {
    return null;
  }

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return <GhostedText multiline>{initialValue}</GhostedText>;
  }

  return (
    <MultiLineCell
      initialValue={initialValue as string}
      fieldId={column.id}
      fieldLabel={getColumnLabel(column)}
      handleUpdate={update}
    />
  );
}

function LazyImage({ row, column, table }: CellContext<ExtendedEntry, unknown>) {
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

  const canWrite = column.columnDef.meta?.canWrite;
  const initialValue = event.custom[column.id];
  return <EditableImage initialValue={initialValue} updateValue={update} readOnly={!canWrite} />;
}

function MakeSingleLineField({ row, column, table }: CellContext<ExtendedEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      table.options.meta?.handleUpdate(row.index, column.id, newValue, false);
    },
    [column.id, row.index, table.options.meta],
  );

  // not all entries have all properties (eg groups)
  const initialValue = row.original[column.id as keyof ExtendedEntry];
  if (typeof initialValue !== 'string') {
    return null;
  }

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return <GhostedText>{initialValue}</GhostedText>;
  }

  return (
    <SingleLineCell
      initialValue={initialValue as string}
      fieldId={column.id}
      fieldLabel={getColumnLabel(column)}
      handleUpdate={update}
    />
  );
}

function MakeFlagField({ row }: CellContext<ExtendedEntry, unknown>) {
  const event = row.original;
  if (!isOntimeEvent(event) || !event.flag) {
    return null;
  }
  return <FlagCell />;
}

function MakeCustomField({ row, column, table }: CellContext<ExtendedEntry, unknown>) {
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

  // entries will not contain the field if there is no value set by the user
  // event if there is no initial value, we still render the cell
  const initialValue = event.custom[column.id] ?? '';

  const canWrite = column.columnDef.meta?.canWrite;
  if (!canWrite) {
    return <GhostedText multiline>{initialValue}</GhostedText>;
  }

  return (
    <MultiLineCell
      initialValue={initialValue}
      fieldId={column.id}
      fieldLabel={getColumnLabel(column)}
      handleUpdate={update}
    />
  );
}

/**
 * we cant use the createColumnHelper() because we have custom logic for rendering the cells
 * This means that the display columns: index and action are added inline by the row components
 */
export function makeCuesheetColumns(
  customFields: CustomFields,
  cuesheetMode: AppMode,
  preset: URLPreset | undefined,
): ColumnDef<ExtendedEntry>[] {
  const columnsDef: ColumnDef<ExtendedEntry>[] = [];
  const { canRead, canWrite } = getCuesheetColumnAccessPolicy(preset, cuesheetMode);

  if (canRead('flag')) {
    columnsDef.push({
      accessorKey: 'flag',
      id: 'flag',
      header: 'Flag',
      cell: MakeFlagField,
      size: 45,
      minSize: 45,
      meta: { canWrite: canWrite('flag') },
    });
  }

  if (canRead('cue')) {
    columnsDef.push({
      accessorKey: 'cue',
      id: 'cue',
      header: 'Cue',
      cell: MakeSingleLineField,
      size: 75,
      minSize: 40,
      meta: { canWrite: canWrite('cue') },
    });
  }

  if (canRead('timeStart')) {
    columnsDef.push({
      accessorKey: 'timeStart',
      id: 'timeStart',
      header: 'Start',
      cell: MakeStart,
      size: 75,
      minSize: 75,
      meta: { canWrite: canWrite('timeStart') },
    });
  }

  if (canRead('timeEnd')) {
    columnsDef.push({
      accessorKey: 'timeEnd',
      id: 'timeEnd',
      header: 'End',
      cell: MakeEnd,
      size: 75,
      minSize: 75,
      meta: { canWrite: canWrite('timeEnd') },
    });
  }

  if (canRead('duration')) {
    columnsDef.push({
      accessorKey: 'duration',
      id: 'duration',
      header: 'Duration',
      cell: MakeDuration,
      size: 75,
      minSize: 75,
      meta: { canWrite: canWrite('duration') },
    });
  }

  if (canRead('title')) {
    columnsDef.push({
      accessorKey: 'title',
      id: 'title',
      header: 'Title',
      cell: MakeSingleLineField,
      size: 250,
      minSize: 75,
      meta: { canWrite: canWrite('title') },
    });
  }

  if (canRead('note')) {
    columnsDef.push({
      accessorKey: 'note',
      id: 'note',
      header: 'Note',
      cell: MakeMultiLineField,
      size: 250,
      minSize: 75,
      meta: { canWrite: canWrite('note') },
    });
  }

  // custom fields at the end
  const customFieldKeys = Object.keys(customFields);

  for (let i = 0; i < customFieldKeys.length; i++) {
    const key = customFieldKeys[i];
    const permissionKey = `custom-${key}`;
    if (!canRead(permissionKey)) continue;
    columnsDef.push({
      accessorKey: key,
      id: key,
      header: customFields[key].label,
      cell: customFields[key].type === 'text' ? MakeCustomField : LazyImage,
      size: 250,
      minSize: 75,
      meta: {
        colour: customFields[key].colour,
        canWrite: canWrite(permissionKey),
      },
    });
  }

  return columnsDef;
}
