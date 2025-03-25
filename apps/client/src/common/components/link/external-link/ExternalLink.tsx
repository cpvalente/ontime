import { MouseEvent, ReactNode } from 'react';
import { IoOpenOutline } from 'react-icons/io5';

import { openLink } from '../../../utils/linkUtils';
import { cx } from '../../../utils/styleUtils';

import style from './ExternalLink.module.scss';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  inline?: boolean;
}

export default function ExternalLink(props: ExternalLinkProps) {
  const { href, inline, children } = props;

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    openLink(href);
  };

  return (
    <a
      href='#!'
      target='_blank'
      rel='noreferrer'
      className={cx([style.link, inline && style.inline])}
      onClick={handleClick}
    >
      {children} <IoOpenOutline style={{ fontSize: '1em' }} />
    </a>
  );
}
