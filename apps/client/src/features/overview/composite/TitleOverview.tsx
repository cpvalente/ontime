import useProjectData from '../../../common/hooks-query/useProjectData';

import style from './TitleOverview.module.scss';

export default function TitleOverview() {
  const { data } = useProjectData();

  if (!data.title && !data.description) {
    return null;
  }

  return (
    <div>
      <div className={style.title}>{data.title}</div>
      <div className={style.description}>{data.description}</div>
    </div>
  );
}
