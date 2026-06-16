import { SupportedEntry } from 'ontime-types';
import { IoAdd } from 'react-icons/io5';

import Button from '../buttons/Button';
import Empty from './Empty';

import style from './EmptyTableBody.module.scss';

interface EmptyTableBodyProps {
  handleAddNew: (type: SupportedEntry) => void;
}

export default function EmptyTableBody({ handleAddNew }: EmptyTableBodyProps) {
  return (
    <tbody className={style.emptyContainer}>
      <tr>
        <td colSpan={99} className={style.emptyCell}>
          <Empty injectedStyles={{ marginTop: '5vh', marginBottom: '3rem' }} />
          <Button onClick={() => handleAddNew(SupportedEntry.Event)} variant='primary' size='large'>
            <IoAdd />
            Create Event
          </Button>
        </td>
      </tr>
    </tbody>
  );
}
