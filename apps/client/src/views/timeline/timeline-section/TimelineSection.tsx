import { MaybeString } from 'ontime-types';
import { memo } from 'react';

import { cx } from '../../../common/utils/styleUtils';

interface SectionProps {
  category: 'now' | 'next' | 'followedBy';
  content: MaybeString;
  title: string;
  status?: string;
}

export default memo(TimelineSection);

function TimelineSection({ category, content, title, status }: SectionProps) {
  const sectionClasses = cx(['section', category === 'now' && 'section--now']);
  const contentClasses = cx(['section-content', content ? `section-content--${category}` : 'section-content--subdue']);
  return (
    <div className={sectionClasses} data-testid={category}>
      <div className='section-title'>
        <span className='section-title__label'>{title}</span>
        {status && <span className='section-title__status'>{status}</span>}
      </div>
      <div className={contentClasses}>{content ?? '-'}</div>
    </div>
  );
}
