import type { HTMLAttributes, JSX, LabelHTMLAttributes, MouseEventHandler } from 'react';
import { IconBaseProps } from 'react-icons';
import { IoArrowUp } from 'react-icons/io5';
import { TbPictureInPictureOff } from 'react-icons/tb';

import { cx } from '../../utils/styleUtils';

import style from './EditorUtils.module.scss';

export function CornerExtract({ className, ...elementProps }: IconBaseProps) {
  return <IoArrowUp className={cx([style.corner, style.arrow, className])} {...elementProps} />;
}

export function CornerPipButton({ className, ...elementProps }: IconBaseProps) {
  return <TbPictureInPictureOff className={cx([style.corner, style.offsetCorner, className])} {...elementProps} />;
}

interface ExtractAndPip extends IconBaseProps {
  onExtractClick: MouseEventHandler<SVGElement>;
  pipElement: JSX.Element;
}

export function CornerWithPip({ className, pipElement, onExtractClick }: ExtractAndPip) {
  return (
    <>
      <IoArrowUp className={cx([style.corner, style.arrow, className])} onClick={onExtractClick} />
      {/* the pip element returns the icon button */}
      {pipElement}
    </>
  );
}

export function Title({ children, className, ...elementProps }: HTMLAttributes<HTMLHeadingElement>) {
  const classes = cx([style.title, className]);
  return (
    <h3 className={classes} {...elementProps}>
      {children}
    </h3>
  );
}

export function Label({ children, className, ...elementProps }: LabelHTMLAttributes<HTMLLabelElement>) {
  const classes = cx([style.label, className]);
  return (
    <label className={classes} {...elementProps}>
      {children}
    </label>
  );
}

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'vertical', ...elementProps }: SeparatorProps) {
  return <div className={cx([style.separator, style[orientation], className])} role='separator' {...elementProps} />;
}
