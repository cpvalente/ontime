import { MouseEvent, ReactNode } from 'react';
import { IoOpenOutline } from '@react-icons/all-files/io5/IoOpenOutline';

import { openLink } from '../../utils/linkUtils';
import { cx } from '../../utils/styleUtils';

import style from './ExternalLink.module.scss';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  inline?: boolean;
}

export default function ExternalLink(props: ExternalLinkProps) {
  const { href, inline, children } = props;
  const classes = cx([style.link, inline ? style.inline : null]);

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    openLink(href);
  };

  return (
    <a href='#!' target='_blank' rel='noreferrer' className={classes} onClick={handleClick}>
      {children} <IoOpenOutline />
    </a>
  );
}
