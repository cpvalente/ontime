import styles from './PreviewContainer.module.css';
import IFrameLoader from './iframes/IFrameLoader';

export default function PreviewContainer() {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewItem}>
        <IFrameLoader
          title='Default Presenter'
          src='http://localhost:3000/speaker'
        />
        <div className={styles.label}>Default Presenter</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader title='Audience' src='http://localhost:3000/public' />
        <div className={styles.label}>Audience</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader title='Stage Manager' src='http://localhost:3000/sm' />
        <div className={styles.label}>Stage Manager</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader
          title='Lower third'
          src='http://localhost:3000/lower?key=242424'
        />
        <div className={styles.label}>Lower third</div>
      </div>
    </div>
  );
}
