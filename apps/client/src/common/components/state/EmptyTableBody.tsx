import { SupportedEntry } from 'ontime-types';
import { IoAdd } from 'react-icons/io5';

import { useTranslation } from '../../../translation/TranslationProvider';
import Button from '../buttons/Button';
import Empty from './Empty';

import style from './EmptyTableBody.module.scss';

interface EmptyTableBodyProps {
  handleAddNew?: (type: SupportedEntry) => void;
}

export default function EmptyTableBody({ handleAddNew }: EmptyTableBodyProps) {
  const { getLocalizedString } = useTranslation();
  const text = getLocalizedString('common.no_data');
  return (
    <tbody className={style.emptyContainer}>
      <tr>
        <td colSpan={99} className={style.emptyCell}>
          <Empty injectedStyles={{ marginTop: '5vh' }} />
          <span className={style.text}>{text}</span>
          {handleAddNew && (
            <div className={style.inline}>
              <Button onClick={() => handleAddNew(SupportedEntry.Event)} variant='primary' size='large'>
                <IoAdd />
                Create Event
              </Button>
            </div>
          )}
        </td>
      </tr>
    </tbody>
  );
}
