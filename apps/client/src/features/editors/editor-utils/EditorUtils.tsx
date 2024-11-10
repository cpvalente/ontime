import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { type IconBaseProps } from '@react-icons/all-files/lib';

import { cx } from '../../../common/utils/styleUtils';

import style from './EditorUtils.module.scss';

export function Corner({ className, ...elementProps }: IconBaseProps) {
  return <IoArrowUp className={cx([style.corner, className])} {...elementProps} />;
}
