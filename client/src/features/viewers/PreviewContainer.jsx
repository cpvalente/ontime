import styles from './PreviewContainer.module.css';
import IFrameLoader from './iframes/IFrameLoader';

// get origin from URL
const serverURL = `${window.location.origin}`;

export default function PreviewContainer() {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewItem}>
        <IFrameLoader
          title='Default Presenter'
          src={`${serverURL}/speaker`}
        />
        <div className={styles.label}>Default Presenter</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader title='Audience' src={`${serverURL}/public`} />
        <div className={styles.label}>Audience</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader title='Stage Manager' src={`${serverURL}/sm`} />
        <div className={styles.label}>Stage Manager</div>
      </div>
      <div className={styles.previewItem}>
        <IFrameLoader
          title='Lower third'
          src={`${serverURL}/lower?key=242424`}
        />
        <div className={styles.label}>Lower third</div>
      </div>
    </div>
  );
}
