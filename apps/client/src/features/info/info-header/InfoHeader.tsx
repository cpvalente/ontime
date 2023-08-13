import useEventData from '../../../common/hooks-query/useEventData';

import style from '../Info.module.scss';

export default function InfoHeader({ selected }: { selected: string }) {
  const { data } = useEventData();

  return (
    <>
      <div className={style.panelHeader}>
        <span className={style.title}>{data?.title || ''}</span>
        <span className={style.selected}>{selected}</span>
      </div>
      <div className={style.description}>{data?.description || ''}</div>
    </>
  );
}
