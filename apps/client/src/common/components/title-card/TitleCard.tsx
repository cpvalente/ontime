import { ForwardedRef, forwardRef } from 'react';

import { useTranslation } from '../../../translation/TranslationProvider';

import './TitleCard.scss';

interface TitleCardProps {
  title?: string;
  label?: 'now' | 'next';
  secondary?: string;
  className?: string;
}

const TitleCard = forwardRef((props: TitleCardProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { label, title, secondary, className = '' } = props;
  const { getLocalizedString } = useTranslation();

  const accent = label === 'now';

  return (
    <div className={`title-card ${className}`} ref={ref}>
      <span className='title-card__title'>{title}</span>
      <span className={accent ? 'title-card__label title-card__label--accent' : 'title-card__label'}>
        {label && getLocalizedString(`common.${label}`)}
      </span>
      <div className='title-card__secondary'>{secondary}</div>
    </div>
  );
});

TitleCard.displayName = 'TitleCard';
export default TitleCard;
