import { MouseEvent, ReactNode } from 'react';
import { HiArrowLongRight } from 'react-icons/hi2';

import { openLink } from '../../../utils/linkUtils';
import { cx } from '../../../utils/styleUtils';

import style from './ExternalLink.module.scss';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  inline?: boolean;
  className?: string;
}

export default function ExternalLink({ href, inline, className, children }: ExternalLinkProps) {
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    openLink(href);
  };

  return (
    <a
      href='#!'
      target='_blank'
      rel='noreferrer'
      className={cx([style.link, inline && style.inline, className])}
      onClick={handleClick}
    >
      {children}
      <HiArrowLongRight className={style.icon} />
    </a>
  );
}
