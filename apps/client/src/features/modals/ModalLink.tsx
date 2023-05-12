import { ReactNode } from 'react';
import { IoOpenOutline } from '@react-icons/all-files/io5/IoOpenOutline';

import { cx } from '../../common/utils/styleUtils';

import style from './ModalLink.module.scss';

interface ModalLinkProps {
  href: string;
  children: ReactNode;
  inline?: boolean;
}

export default function ModalLink(props: ModalLinkProps) {
  const { href, inline, children } = props;
  const classes = cx([style.link, inline ? style.inline : null]);
  return (
    <a href={href} target='_blank' rel='noreferrer' className={classes}>
      {children} <IoOpenOutline />
    </a>
  );
}
