import { cx } from '../../../common/utils/styleUtils';
import { formatTimezoneDelta } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import style from './Timezone.module.scss';

interface TimezoneBadgeProps {
  displayZone: string;
  timezoneDelta: number;
  /** corner floats the badge over the view, inline leaves placement to the parent */
  placement?: 'corner' | 'inline';
}

/**
 * Flags that wall-clock times are shifted away from show time
 */
export default function TimezoneBadge({ displayZone, timezoneDelta, placement = 'corner' }: TimezoneBadgeProps) {
  const { getLocalizedString } = useTranslation();

  if (timezoneDelta === 0) {
    return null;
  }

  return (
    <div className={cx([style.badge, placement === 'corner' && style.corner])} data-testid='timezone-badge'>
      <span className={style.zone}>{displayZone}</span>
      <span className={style.delta}>
        {formatTimezoneDelta(timezoneDelta)} {getLocalizedString('common.from_show_time')}
      </span>
    </div>
  );
}
