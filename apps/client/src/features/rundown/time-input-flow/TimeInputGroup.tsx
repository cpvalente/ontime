import { PropsWithChildren } from 'react';

import { cx } from '../../../common/utils/styleUtils';

import style from './TimeInputGroup.module.scss';

interface TimeInputGroupProps {
  hasDelay?: boolean;
}

export default function TimeInputGroup({ hasDelay, children }: PropsWithChildren<TimeInputGroupProps>) {
  return <div className={cx([style.inputGroup, hasDelay && style.delayed])}>{children}</div>;
}
