import { memo } from 'react';
import { MaybeString } from 'ontime-types';

import { cx } from '../../../common/utils/styleUtils';

interface SectionProps {
  category: 'now' | 'next';
  content: MaybeString;
  title: string;
  status?: string;
}

export default memo(Section);

function Section(props: SectionProps) {
  const { category, content, title, status } = props;

  const sectionClasses = cx(['section', category === 'now' && 'section--now']);
  const contentClasses = cx(['section-content', content ? `section-content--${category}` : 'section-content--subdue']);
  return (
    <div className={sectionClasses}>
      <div className='section-title'>
        <span className='section-title__label'>{title}</span>
        {status && <span className='section-title__status'>{status}</span>}
      </div>
      <div className={contentClasses}>{content ?? '-'}</div>
    </div>
  );
}
