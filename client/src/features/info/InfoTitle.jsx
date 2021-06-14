import { Icon } from '@chakra-ui/react';
import { useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import style from './Info.module.css';

export default function InfoTitle(props) {
  const [collapsed, setCollapsed] = useState(false);

  const { title, data } = props;
  return (
    <div className={style.container}>
      <div className={style.header}>
        {title}
        <Icon
          className={collapsed ? style.moreCollapsed : style.moreExpanded}
          as={FiChevronUp}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>

      {!collapsed && (
        <>
          <div>
            <span className={style.label}>Title: </span>
            {data.title}
          </div>
          <div>
            <span className={style.label}>Presenter: </span>
            {data.presenter}
          </div>
          <div>
            <span className={style.label}>Subtitle: </span>
            {data.subtitle}
          </div>
          <div className={style.notes}>
            <span className={style.label}>Note: </span>
            {data.note}
          </div>
        </>
      )}
    </div>
  );
}
