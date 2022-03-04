import React from 'react';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { stringFromMillis } from 'ontime-utils/time';
import EditableCell from './EditableCell';
import style from './Table.module.scss';

export const makeColumns = (sizes) => {
  return [
    {
      Header: 'Type',
      accessor: 'type',
      Cell: ({ cell: { value } }) => {
        const firstCap = value.charAt(0).toUpperCase();
        const caps = firstCap + value.slice(1);
        return (
          <Tooltip label={caps} placement='right'>
            <span className={style.badge}>{firstCap}</span>
          </Tooltip>
        );
      },
      width: sizes?.type || 25,
    },
    {
      Header: 'Public',
      accessor: 'isPublic',
      Cell: ({ cell: { value } }) => (value != null ? <FiCheck /> : <FiX />),
      width: sizes?.isPublic || 25,
    },
    {
      Header: 'Start',
      accessor: 'timeStart',
      Cell: ({ cell: { value } }) => stringFromMillis(value),
      width: sizes?.timeStart || 90,
    },
    {
      Header: 'End',
      accessor: 'timeEnd',
      Cell: ({ cell: { value } }) => stringFromMillis(value),
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
}