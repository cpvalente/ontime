import React from 'react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';

import { stringFromMillis } from '../../common/utils/time.js';

import EditableCell from './tableElements/EditableCell';

import style from './Table.module.scss';

/**
 * React - Table column object
 * @param sizes
 * @param userFields
 */
export const makeColumns = (sizes, userFields) => {
  return [
    {
      Header: 'Public',
      accessor: 'isPublic',
      Cell: ({ cell: { value } }) => (value ? <FiCheck className={style.check} /> : ''),
      width: sizes?.isPublic || 50,
    },
    {
      Header: 'Start',
      accessor: 'timeStart',
      Cell: ({ cell: { value, delayed } }) => stringFromMillis(delayed || value),
      width: sizes?.timeStart || 90,
    },
    {
      Header: 'End',
      accessor: 'timeEnd',
      Cell: ({ cell: { value, delayed } }) => stringFromMillis(delayed || value),
      width: sizes?.timeEnd || 90,
    },
    {
      Header: 'Duration',
      accessor: 'duration',
      Cell: ({ cell: { value } }) => stringFromMillis(value),
      width: sizes?.duration || 90,
    },
    { Header: 'Title', accessor: 'title', width: sizes?.title || 400 },
    { Header: 'Subtitle', accessor: 'subtitle', width: sizes?.subtitle || 350 },
    { Header: 'Presenter', accessor: 'presenter', width: sizes?.presenter || 250 },
    { Header: 'Notes', accessor: 'note', width: sizes?.note || 500 },
    {
      Header: userFields.user0 || 'User 0',
      accessor: 'user0',
      Cell: EditableCell,
      width: sizes?.user0 || 200,
    },
    {
      Header: userFields.user1 || 'User 1',
      accessor: 'user1',
      Cell: EditableCell,
      width: sizes?.user1 || 200,
    },
    {
      Header: userFields.user2 || 'User 2',
      accessor: 'user2',
      Cell: EditableCell,
      width: sizes?.user2 || 200,
    },
    {
      Header: userFields.user3 || 'User 3',
      accessor: 'user3',
      Cell: EditableCell,
      width: sizes?.user3 || 200,
    },
    {
      Header: userFields.user4 || 'User 4',
      accessor: 'user4',
      Cell: EditableCell,
      width: sizes?.user4 || 200,
    },
    {
      Header: userFields.user5 || 'User 5',
      accessor: 'user5',
      Cell: EditableCell,
      width: sizes?.user5 || 200,
    },
    {
      Header: userFields.user6 || 'User 6',
      accessor: 'user6',
      Cell: EditableCell,
      width: sizes?.user6 || 200,
    },
    {
      Header: userFields.user7 || 'User 7',
      accessor: 'user7',
      Cell: EditableCell,
      width: sizes?.user7 || 200,
    },
    {
      Header: userFields.user8 || 'User 8',
      accessor: 'user8',
      Cell: EditableCell,
      width: sizes?.user8 || 200,
    },
    {
      Header: userFields.user9 || 'User 9',
      accessor: 'user9',
      Cell: EditableCell,
      width: sizes?.user9 || 200,
    },
  ];
};
