import { MouseEvent, ReactNode } from 'react';
import { IoOpenOutline } from '@react-icons/all-files/io5/IoOpenOutline';

import { openLink } from '../../common/utils/linkUtils';

import style from './ModalLink.module.scss';

interface ModalLinkProps {
  href: string;
  children: ReactNode;
}

export default function ModalLink({ href, children }: ModalLinkProps) {
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    openLink(href);
  };

  return (
    <a href='#!' target='_blank' rel='noreferrer' className={style.link} onClick={handleClick}>
      {children} <IoOpenOutline />
    </a>
  );
}
