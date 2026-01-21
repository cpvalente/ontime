import style from './TitleListEmpty.module.scss';

export default function TitleListEmpty() {
  return (
    <div className={style.container}>
      <div className={style.emptyState}>
        <div className={style.emptyMessage}>
          <h3 className={style.emptyTitle}>No events yet</h3>
          <p className={style.emptyBody}>Add events in the rundown to populate this list.</p>
        </div>
      </div>
    </div>
  );
}
