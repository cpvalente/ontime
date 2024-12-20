import { useCallback } from 'react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeEvent, OntimeEvent, OntimeRundownEntry } from 'ontime-types';

import DelayIndicator from '../../../../common/components/delay-indicator/DelayIndicator';
import RunningTime from '../../../../features/viewers/common/running-time/RunningTime';
import { useCuesheetOptions } from '../../cuesheet.options';

import MultiLineCell from './MultiLineCell';
import SingleLineCell from './SingleLineCell';

import style from '../CuesheetTable.module.scss';

function MakeTimer({ getValue, row: { original } }: CellContext<OntimeRundownEntry, unknown>) {
  const { showDelayedTimes, hideTableSeconds } = useCuesheetOptions();
  const cellValue = (getValue() as number | null) ?? 0;
  const delayValue = (original as OntimeEvent)?.delay ?? 0;

  return (
    <span className={style.time}>
      <DelayIndicator delayValue={delayValue} />
      <RunningTime value={cellValue} hideSeconds={hideTableSeconds} />
      {delayValue !== 0 && showDelayedTimes && (
        <RunningTime className={style.delayedTime} value={cellValue + delayValue} hideSeconds={hideTableSeconds} />
      )}
    </span>
  );
}

function MakeDuration({ getValue }: CellContext<OntimeRundownEntry, unknown>) {
  const { hideTableSeconds } = useCuesheetOptions();
  const cellValue = (getValue() as number | null) ?? 0;

  return <RunningTime value={cellValue} hideSeconds={hideTableSeconds} />;
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
      cell: MakeTimer,
      size: 75,
      minSize: 75,
    },
    {
      accessorKey: 'timeEnd',
      id: 'timeEnd',
      header: 'End',
      cell: MakeTimer,
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
