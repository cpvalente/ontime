import { cx } from '../../utils/styleUtils';
import Empty from './Empty';

import style from './EmptyFill.module.scss';

interface EmptyFillProps {
  text?: string;
  /** placed on the fill wrapper — e.g. to assign a grid-area in a grid parent */
  className?: string;
}

/** Container-filling empty/loading state for panels and grid/flex cells. */
export default function EmptyFill({ text, className }: EmptyFillProps) {
  return (
    <div className={cx([style.fill, className])}>
      <Empty text={text} />
    </div>
  );
}
