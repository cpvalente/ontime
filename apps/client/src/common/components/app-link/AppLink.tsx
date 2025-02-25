import { MouseEvent, ReactNode } from 'react';
import { IoArrowUp } from 'react-icons/io5';

import { openLink } from '../../utils/linkUtils';

import style from './AppLink.module.scss';

interface AppLinkProps {
  href: string;
  children: ReactNode;
}

export default function AppLink(props: AppLinkProps) {
  const { href, children } = props;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openLink(href);
  };

  return (
    <a href='#!' target='_blank' rel='noreferrer' className={style.link} onClick={handleClick}>
      {children} <IoArrowUp className={style.linkIcon} />
    </a>
  );
}
