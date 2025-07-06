import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

import { millisToDelayString } from '../../utils/dateConfig';
import Tooltip from '../tooltip/Tooltip';

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
    <Tooltip text={delayString} render={<span />} className={style.delaySymbol}>
      {delayValue < 0 ? <IoChevronDown /> : <IoChevronUp />}
    </Tooltip>
  );
}
