import { Icon } from '@chakra-ui/react';
import { FiChevronUp } from 'react-icons/fi';
import style from './Info.module.css';

export default function InfoTitle(props) {
  const { title, data } = props;
  return (
    <div className={style.container}>
      <div className={style.header}>
        {title}
        <Icon
          className={style.moreExpanded}
          as={FiChevronUp}
          marginTop='-0.5em'
          // onClick={() => props.setCollapsed(true)}
        />
      </div>

      <div>
        <span className={style.label}>Title: </span>
        {data.title}
      </div>
      <div>
        <span className={style.label}>Subtitle: </span>
        {data.subtitle}
      </div>
      <div>
        <span className={style.label}>Presenter: </span>
        {data.presenter}
      </div>
      <div>
        <span className={style.label}>Notes: </span>
        {data.note}
      </div>
    </div>
  );
}
