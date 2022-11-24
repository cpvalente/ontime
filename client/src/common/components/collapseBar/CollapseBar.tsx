import { FiChevronUp } from '@react-icons/all-files/fi/FiChevronUp';

import style from './CollapseBar.module.scss';

interface CollapseBarProps {
  title: string;
  isCollapsed: boolean;
  onClick: () => void;
}

export default function CollapseBar(props: CollapseBarProps) {
  const { title = 'Collapse bar', isCollapsed, onClick } = props;

  return (
    <div className={style.header} onClick={onClick}>
      {title}
      <FiChevronUp className={isCollapsed ? style.moreCollapsed : style.moreExpanded} />
    </div>
  );
}
