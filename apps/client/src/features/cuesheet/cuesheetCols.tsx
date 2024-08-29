import { useCallback } from 'react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { CustomFields, CustomFieldType, isOntimeEvent, OntimeEvent, OntimeRundownEntry } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import DelayIndicator from '../../common/components/delay-indicator/DelayIndicator';
import RunningTime from '../viewers/common/running-time/RunningTime';

import EditableCell from './cuesheet-table-elements/EditableCell';
import { useCuesheetSettings } from './store/CuesheetSettings';

import style from './Cuesheet.module.scss';

function makePublic(row: CellContext<OntimeRundownEntry, unknown>) {
  const cellValue = row.getValue();
  return cellValue ? <IoCheckmark className={style.check} /> : '';
}

function MakeTimer({ getValue, row: { original } }: CellContext<OntimeRundownEntry, unknown>) {
  const showDelayedTimes = useCuesheetSettings((state) => state.showDelayedTimes);
  const cellValue = (getValue() as number | null) ?? 0;
  const delayValue = (original as OntimeEvent)?.delay ?? 0;

  return (
    <span className={style.time}>
      <DelayIndicator delayValue={delayValue} />
      <RunningTime value={cellValue} />
      {delayValue !== 0 && showDelayedTimes && (
        <RunningTime className={style.delayedTime} value={cellValue + delayValue} />
      )}
    </span>
  );
}

function MakeCustomField({ row, column, table }: CellContext<OntimeRundownEntry, unknown>) {
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

  const meta = column.columnDef.meta ?? {};
  const type = 'type' in meta ? meta.type : CustomFieldType.String;
  // events dont necessarily contain all custom fields
  const initialValue = event.custom[column.id] ?? '';

  return <EditableCell value={initialValue} handleUpdate={update} isMarkdown={type === CustomFieldType.Markdown} />;
}

export function makeCuesheetColumns(customFields: CustomFields): ColumnDef<OntimeRundownEntry>[] {
  const dynamicCustomFields = Object.keys(customFields).map((key) => ({
    accessorKey: key,
    id: key,
    header: customFields[key].label,
    meta: { colour: customFields[key].colour, type: customFields[key].type },
    cell: MakeCustomField,
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
      cell: makePublic,
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
      cell: (row) => millisToString(row.getValue() as number | null),
      size: 75,
    },
    {
      accessorKey: 'title',
      id: 'title',
      header: 'Title',
      cell: (row) => row.getValue(),
      size: 250,
    },
    {
      accessorKey: 'note',
      id: 'note',
      header: 'Note',
      cell: (row) => row.getValue(),
      size: 250,
    },
    ...dynamicCustomFields,
  ];
}
