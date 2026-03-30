import { PropsWithChildren } from 'react';
import { IoAlertCircle, IoWarning } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';

import style from './Info.module.scss';

interface InfoProps {
  className?: string;
  type?: 'info' | 'warning' | 'error';
}

interface InfoSectionProps {
  className?: string;
}

function InfoTitle({ className, children }: PropsWithChildren<InfoSectionProps>) {
  return <p className={cx([style.title, className])}>{children}</p>;
}

function InfoBody({ className, children }: PropsWithChildren<InfoSectionProps>) {
  return <p className={cx([style.body, className])}>{children}</p>;
}

function InfoFooter({ className, children }: PropsWithChildren<InfoSectionProps>) {
  return <div className={cx([style.footer, className])}>{children}</div>;
}

function InfoRoot({ className, type = 'info', children }: PropsWithChildren<InfoProps>) {
  return (
    <div className={cx([style.infoLabel, style[type], className])}>
      {type === 'info' && <IoAlertCircle />}
      {type === 'warning' && <IoWarning />}
      {type === 'error' && <IoWarning />}
      <div className={style.content}>{children}</div>
    </div>
  );
}

const Info = Object.assign(InfoRoot, {
  Title: InfoTitle,
  Body: InfoBody,
  Footer: InfoFooter,
});

export default Info;
