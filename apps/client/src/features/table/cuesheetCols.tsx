import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { OntimeRundownEntry, UserFields } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import EditableCell from './tableElements/EditableCell';

import style from './Cuesheet.module.scss';
import { useCallback } from 'react';

function makePublic(row: CellContext<OntimeRundownEntry, unknown>) {
  const cellValue = row.getValue();
  return cellValue ? <IoCheckmark className={style.check} /> : '';
}

function makeTimer(row: CellContext<OntimeRundownEntry, unknown>) {
  // TODO: add optional delay
  const cellValue = row.getValue() as number | null;
  return millisToString(cellValue);
}

function MakeUserField({ getValue, row: { index }, column: { id }, table }: CellContext<OntimeRundownEntry, unknown>) {
  const update = useCallback(
    (newValue: string) => {
      // @ts-expect-error -- we inject this into react-table
      table.options.meta?.handleUpdate(index, id, newValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we skip table.options.meta since the reference seems unstable
    [id, index],
  );

  const initialValue = getValue() as string;

  return <EditableCell value={initialValue} handleUpdate={update} />;
}

export function makeCuesheetColumns(userFields?: UserFields): ColumnDef<OntimeRundownEntry>[] {
  return [
    {
      accessorKey: 'isPublic',
      id: 'isPublic',
      header: 'Public',
      cell: makePublic,
      size: 50,
    },
    {
      accessorKey: 'timeStart',
      id: 'timeStart',
      header: 'Start',
      cell: makeTimer,
      size: 75,
    },
    {
      accessorKey: 'timeEnd',
      id: 'timeEnd',
      header: 'End',
      cell: makeTimer,
      size: 75,
    },
    {
      accessorKey: 'duration',
      id: 'duration',
      header: 'Duration',
      cell: makeTimer,
      size: 75,
    },
    {
      accessorKey: 'title',
      id: 'title',
      header: 'Title',
      cell: (row) => row.getValue(),
    },
    {
      accessorKey: 'subtitle',
      id: 'subtitle',
      header: 'Subtitle',
      cell: (row) => row.getValue(),
    },
    {
      accessorKey: 'presenter',
      id: 'presenter',
      header: 'Presenter',
      cell: (row) => row.getValue(),
    },
    {
      accessorKey: 'note',
      id: 'note',
      header: 'Note',
      cell: (row) => row.getValue(),
    },
    {
      accessorKey: 'user0',
      id: 'user0',
      header: userFields?.user0 || 'User 0',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user1',
      id: 'user1',
      header: userFields?.user1 || 'User 1',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user2',
      id: 'user2',
      header: userFields?.user2 || 'User 2',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user3',
      id: 'user3',
      header: userFields?.user3 || 'User 3',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user4',
      id: 'user4',
      header: userFields?.user4 || 'User 4',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user5',
      id: 'user5',
      header: userFields?.user5 || 'User 5',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user6',
      id: 'user6',
      header: userFields?.user6 || 'User 6',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user7',
      id: 'user7',
      header: userFields?.user7 || 'User 7',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user8',
      id: 'user8',
      header: userFields?.user8 || 'User 8',
      cell: MakeUserField,
    },
    {
      accessorKey: 'user9',
      id: 'user9',
      header: userFields?.user9 || 'User 9',
      cell: MakeUserField,
    },
  ];
}

export const initialColumnOrder: string[] = makeCuesheetColumns().map((column) => column.id as string);
