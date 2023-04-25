import { ReactNode } from 'react';
import { IoOpenOutline } from '@react-icons/all-files/io5/IoOpenOutline';

import style from './ModalLink.module.scss';

interface ModalLinkProps {
  href: string;
  children: ReactNode;
}

export default function ModalLink(props: ModalLinkProps) {
  const { href, children } = props;
  return (
    <a href={href} target='_blank' rel='noreferrer' className={style.link}>
      {children} <IoOpenOutline />
    </a>
  );
}
