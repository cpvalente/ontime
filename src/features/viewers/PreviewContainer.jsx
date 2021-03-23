import DefaultPresenter from './DefaultPresenter';
import styles from './PreviewContainer.module.css';

export default function PreviewContainer(props) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewItem}>
        <div className={styles.preview}>
          <DefaultPresenter data={props.data} preview/>
        </div>
        <div className={styles.label}>Default Presenter</div>
      </div>
      <div className={styles.previewItem}>
        <div className={styles.preview}></div>
        <div className={styles.label}>Audience</div>
      </div>
      <div className={styles.previewItem}>
        <div className={styles.preview}></div>
        <div className={styles.label}>Stage Manager</div>
      </div>
      <div className={styles.previewItem}>
        <div className={styles.preview}></div>
        <div className={styles.label}>Lower third</div>
      </div>
    </div>
  );
}
