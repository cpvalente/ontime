import { MaybeString } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import style from './Timezone.module.scss';

interface ShowTimeAnchorProps {
  clock: number;
  timezoneDelta: number;
  timeformat?: MaybeString;
  className?: string;
}

/**
 * Shows the unshifted clock under a clock shifted to another timezone
 */
export default function ShowTimeAnchor({ clock, timezoneDelta, timeformat, className }: ShowTimeAnchorProps) {
  const { getLocalizedString } = useTranslation();

  if (timezoneDelta === 0) {
    return null;
  }

  return (
    <div className={className ?? style.showTime} data-testid='show-time-anchor'>
      {getLocalizedString('common.show_time')} {formatTime(clock, { override: timeformat })}
    </div>
  );
}
