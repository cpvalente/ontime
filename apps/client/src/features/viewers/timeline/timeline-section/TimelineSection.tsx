import { MaybeString } from 'ontime-types';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TimelineSection.module.scss';

interface SectionProps {
  category: 'now' | 'next';
  content: MaybeString;
  title: string;
}

export default function Section(props: SectionProps) {
  const { category, content, title } = props;

  const contentClasses = cx([style.sectionContent, content != null ? style[category] : style.subdue]);
  return (
    <div>
      <div className={style.sectionTitle}>{title}</div>
      <div className={contentClasses}>{content ?? '-'}</div>
    </div>
  );
}
