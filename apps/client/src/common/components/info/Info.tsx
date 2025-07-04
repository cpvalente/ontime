import { PropsWithChildren } from 'react';
import { IoAlertCircle, IoWarning } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';

import style from './Info.module.scss';

interface InfoProps {
  className?: string;
  type?: 'info' | 'warning' | 'error';
}

export default function Info({ className, type = 'info', children }: PropsWithChildren<InfoProps>) {
  return (
    <div className={cx([style.infoLabel, style[type], className])}>
      {type === 'info' && <IoAlertCircle />}
      {type === 'warning' && <IoWarning />}
      {type === 'error' && <IoWarning />}
      <div>{children}</div>
    </div>
  );
}
