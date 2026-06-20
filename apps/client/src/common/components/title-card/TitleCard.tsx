import { ForwardedRef, forwardRef } from 'react';

import { useTranslation } from '../../../translation/TranslationProvider';
import { ExpectedEvent } from '../../utils/rundownMetadata';
import { cx, enDash } from '../../utils/styleUtils';
import ScheduleTime from '../schedule-time/ScheduleTime';

import './TitleCard.scss';

interface TitleCardProps {
  title?: string;
  label?: 'now' | 'next';
  secondary?: string;
  className?: string;
  colour?: string;
  textAlign?: 'left' | 'right' | 'center';
  size?: 'md' | 'lg';
  event?: ExpectedEvent;
  showExpected?: boolean;
  placeholder?: string;
}

const TitleCard = forwardRef((props: TitleCardProps, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    label,
    title,
    secondary,
    className = '',
    colour = 'transparent',
    textAlign = 'left',
    size = 'md',
    event,
    showExpected = false,
    placeholder = enDash,
  } = props;
  const { getLocalizedString } = useTranslation();

  const accent = label === 'now';

  return (
    <div className={cx(['title-card', className, size])} style={{ borderColor: colour }} ref={ref}>
      {event && <ScheduleTime event={event} showExpected={showExpected} />}
      <span className='title-card__title' style={{ textAlign }} data-placeholder={placeholder}>
        {title}
      </span>
      <span className={cx(['title-card__label', accent && 'title-card__label--accent'])}>
        {label && getLocalizedString(`common.${label}`)}
      </span>
      <div className='title-card__secondary'>{secondary}</div>
    </div>
  );
});

TitleCard.displayName = 'TitleCard';
export default TitleCard;
