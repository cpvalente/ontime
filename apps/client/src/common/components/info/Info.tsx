import { PropsWithChildren } from 'react';
import { IoAlertCircle } from '@react-icons/all-files/io5/IoAlertCircle';

import { cx } from '../../utils/styleUtils';

import style from './Info.module.scss';

interface InfoProps {
  className?: string;
}

export default function Info(props: PropsWithChildren<InfoProps>) {
  const { className, children } = props;

  return (
    <div className={cx([style.infoLabel, className])}>
      <IoAlertCircle />
      <div>{children}</div>
    </div>
  );
}
