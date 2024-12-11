import { useCallback } from 'react';
import { Checkbox } from '@chakra-ui/react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, isOntimeEvent, OntimeEvent, OntimeRundownEntry } from 'ontime-types';

import DelayIndicator from '../../common/components/delay-indicator/DelayIndicator';
import RunningTime from '../../features/viewers/common/running-time/RunningTime';

import EditableCell from './cuesheet-table-elements/EditableCell';
import { useCuesheetSettings } from './store/cuesheetSettingsStore';

import style from './Cuesheet.module.scss';

function MakePublic({ row, column, table }: CellContext<OntimeRundownEntry, unknown>) {
  const update = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // @ts-expect-error -- we inject this into react-table
      table.options.meta?.handleUpdate(row.index, column.id, event.target.checked);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const isChecked = event.isPublic;

  return (
    <Checkbox variant='ontime-ondark' onChange={update} isChecked={isChecked} style={{ verticalAlign: 'middle' }} />
  );
}

function MakeTimer({ getValue, row: { original } }: CellContext<OntimeRundownEntry, unknown>) {
  const showDelayedTimes = useCuesheetSettings((state) => state.showDelayedTimes);
  const hideSeconds = useCuesheetSettings((state) => state.hideSeconds);
  const cellValue = (getValue() as number | null) ?? 0;
  const delayValue = (original as OntimeEvent)?.delay ?? 0;

  return (
    <span className={style.time}>
      <DelayIndicator delayValue={delayValue} />
      <RunningTime value={cellValue} hideSeconds={hideSeconds} />
      {delayValue !== 0 && showDelayedTimes && (
        <RunningTime className={style.delayedTime} value={cellValue + delayValue} hideSeconds={hideSeconds} />
      )}
    </span>
  );
}

function MakeDuration({ getValue }: CellContext<OntimeRundownEntry, unknown>) {
  const hideSeconds = useCuesheetSettings((state) => state.hideSeconds);
  const cellValue = (getValue() as number | null) ?? 0;

  return <RunningTime value={cellValue} hideSeconds={hideSeconds} />;
}

function MakeField({ row, column, table }: CellContext<OntimeRundownEntry, unknown>, isMultiLine: boolean) {
  const update = useCallback(
    (newValue: string) => {
      // @ts-expect-error -- we inject this into react-table
      table.options.meta?.handleUpdate(row.index, column.id, newValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [column.id, row.index],
  );

  const event = row.original;
  if (!isOntimeEvent(event)) {
    return null;
  }

  const initialValue = event[column.id as keyof OntimeRundownEntry] ?? '';

  return <EditableCell isMultiLine={isMultiLine} value={initialValue} handleUpdate={update} />;
}

export function makeCuesheetColumns(customFields: CustomFields): ColumnDef<OntimeRundownEntry>[] {
  const dynamicCustomFields = Object.keys(customFields).map((key) => ({
    accessorKey: key,
    id: `custom_${key}`,
    header: customFields[key].label,
    meta: { colour: customFields[key].colour },
    cell: (context: CellContext<OntimeRundownEntry, unknown>) => MakeField(context, true),
    size: 250,
  }));

  return [
    {
      accessorKey: 'cue',
      id: 'cue',
      header: 'Cue',
      cell: (row) => row.getValue(),
      size: 75,
    },
    {
      accessorKey: 'isPublic',
      id: 'isPublic',
      header: 'Public',
      cell: MakePublic,
      size: 45,
    },
    {
      accessorKey: 'timeStart',
      id: 'timeStart',
      header: 'Start',
      cell: MakeTimer,
      size: 75,
    },
    {
      accessorKey: 'timeEnd',
      id: 'timeEnd',
      header: 'End',
      cell: MakeTimer,
      size: 75,
    },
    {
      accessorKey: 'duration',
      id: 'duration',
      header: 'Duration',
      cell: MakeDuration,
      size: 75,
    },
    {
      accessorKey: 'title',
      id: 'title',
      header: 'Title',
      cell: (context: CellContext<OntimeRundownEntry, unknown>) => MakeField(context, false),
      size: 250,
    },
    {
      accessorKey: 'note',
      id: 'note',
      header: 'Note',
      cell: (context: CellContext<OntimeRundownEntry, unknown>) => MakeField(context, true),
      size: 250,
    },
    ...dynamicCustomFields,
  ];
}
