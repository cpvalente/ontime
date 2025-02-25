import { IoChevronDown } from 'react-icons/io5';
import { IoChevronUp } from 'react-icons/io5';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { millisToDelayString } from '../../utils/dateConfig';
import { Tooltip } from '../ui/tooltip';

import style from './DelayIndicator.module.scss';

interface DelayIndicatorProps {
  delayValue?: number;
  tooltipPrefix?: string;
}

export default function DelayIndicator(props: DelayIndicatorProps) {
  const { delayValue, tooltipPrefix } = props;

  if (typeof delayValue !== 'number' || delayValue === 0) {
    return null;
  }

  const delayString = tooltipPrefix
    ? `${tooltipPrefix} ${millisToDelayString(delayValue)}`
    : millisToDelayString(delayValue);

  return (
    <Tooltip openDelay={tooltipDelayFast} content={delayString}>
      <span className={style.delaySymbol}>{delayValue < 0 ? <IoChevronDown /> : <IoChevronUp />}</span>
    </Tooltip>
  );
}
