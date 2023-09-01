import { Tooltip } from '@chakra-ui/react';
import { IoChevronDown } from '@react-icons/all-files/io5/IoChevronDown';
import { IoChevronUp } from '@react-icons/all-files/io5/IoChevronUp';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { millisToDelayString } from '../../utils/dateConfig';

import style from './DelayIndicator.module.scss';

interface DelayIndicatorProps {
  delayValue?: number;
}

export default function DelayIndicator(props: DelayIndicatorProps) {
  const { delayValue } = props;

  if (typeof delayValue === 'number') {
    if (delayValue < 0) {
      return (
        <Tooltip openDelay={tooltipDelayFast} label={millisToDelayString(delayValue)}>
          <span className={style.delaySymbol}>
            <IoChevronDown />
          </span>
        </Tooltip>
      );
    }

    if (delayValue > 0) {
      return (
        <Tooltip openDelay={tooltipDelayFast} label={millisToDelayString(delayValue)}>
          <span className={style.delaySymbol}>
            <IoChevronUp />
          </span>
        </Tooltip>
      );
    }
  }

  return null;
}
