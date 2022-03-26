import React from 'react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { stringFromMillis } from 'ontime-utils/time';
import EditableCell from './tableElements/EditableCell';

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
      Cell: ({ cell: { value } }) => (value != null ? <FiCheck /> : <FiX />),
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
    { Header: 'Title', accessor: 'title', width: sizes?.title || 200 },
    { Header: 'Subtitle', accessor: 'subtitle', width: sizes?.subtitle || 150 },
    { Header: 'Presenter', accessor: 'presenter', width: sizes?.presenter || 150 },
    { Header: 'Notes', accessor: 'note', width: sizes?.note || 200 },
    { Header: userFields.user0 || 'User 0', accessor: 'user0', Cell: EditableCell, width: sizes?.user0 || 200 },
    { Header: userFields.user1 || 'User 1', accessor: 'user1', Cell: EditableCell, width: sizes?.user1 || 200 },
    { Header: userFields.user2 || 'User 2', accessor: 'user2', Cell: EditableCell, width: sizes?.user2 || 200 },
    { Header: userFields.user3 || 'User 3', accessor: 'user3', Cell: EditableCell, width: sizes?.user3 || 200 },
    { Header: userFields.user4 || 'User 4', accessor: 'user4', Cell: EditableCell, width: sizes?.user4 || 200 },
    { Header: userFields.user5 || 'User 5', accessor: 'user5', Cell: EditableCell, width: sizes?.user5 || 200 },
    { Header: userFields.user6 || 'User 6', accessor: 'user6', Cell: EditableCell, width: sizes?.user6 || 200 },
    { Header: userFields.user7 || 'User 7', accessor: 'user7', Cell: EditableCell, width: sizes?.user7 || 200 },
    { Header: userFields.user8 || 'User 8', accessor: 'user8', Cell: EditableCell, width: sizes?.user8 || 200 },
    { Header: userFields.user9 || 'User 9', accessor: 'user9', Cell: EditableCell, width: sizes?.user9 || 200 },
  ];
};
