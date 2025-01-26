import { PropsWithChildren } from 'react';
import { IoAlertCircle } from '@react-icons/all-files/io5/IoAlertCircle';

import style from './Info.module.scss';

export default function Info({ children }: PropsWithChildren) {
  return (
    <div className={style.infoLabel}>
      <IoAlertCircle />
      {children}
    </div>
  );
}
