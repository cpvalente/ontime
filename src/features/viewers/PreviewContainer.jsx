import DefaultPresenter from './DefaultPresenter';
import styles from './PreviewContainer.module.css';

export default function PreviewContainer() {
  return (
    <div className={styles.previewContainer}>

      <div className={styles.preview}>
        {/* <DefaultPresenter /> */}
      </div>
      <div className={styles.label}>Default Presenter</div>

      <div className={styles.preview}>
      </div>
      <div className={styles.label}>Audience</div>
    </div>
  );
}
