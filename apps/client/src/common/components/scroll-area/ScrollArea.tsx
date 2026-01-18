import { CSSProperties, PropsWithChildren, Ref } from 'react';
import { ScrollArea } from '@base-ui/react/scroll-area';

import { cx } from '../../utils/styleUtils';

import style from './ScrollArea.module.scss';

interface ScrollAreaProps {
  className?: string;
  viewportClassName?: string;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  orientation?: 'vertical' | 'horizontal';
}

export default function StyledScrollArea({
  className,
  viewportClassName,
  contentClassName,
  contentStyle,
  children,
  ref,
  orientation = 'vertical',
}: PropsWithChildren<ScrollAreaProps>) {
  return (
    <ScrollArea.Root className={cx([style.root, className])}>
      <ScrollArea.Viewport ref={ref} className={cx([style.viewport, viewportClassName])}>
        <ScrollArea.Content className={contentClassName} style={contentStyle}>
          {children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={style.scrollbar} orientation={orientation}>
        <ScrollArea.Thumb className={style.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
