import React from 'react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { stringFromMillis } from 'ontime-utils/time';
import EditableCell from './tableElements/EditableCell';

/**
 * React - Table column object
 * @param sizes
 */
export const makeColumns = (sizes) => {
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
    { Header: 'Light', accessor: 'light', Cell: EditableCell, width: sizes?.light || 200 },
    { Header: 'Cam', accessor: 'cam', Cell: EditableCell, width: sizes?.cam || 200 },
    { Header: 'Video', accessor: 'video', Cell: EditableCell, width: sizes?.video || 200 },
    { Header: 'Audio', accessor: 'audio', Cell: EditableCell, width: sizes?.audio || 200 },
  ];
};
