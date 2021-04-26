import styles from './PreviewContainer.module.css';
import IFrameLoader from './iframes/IFrameLoader';

// get origin from URL
const serverURL = `${window.location.origin}`;

export default function PreviewContainer() {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewItem}>
        <IFrameLoader title='Default Presenter' src={`${serverURL}/speaker`} />
        <a
          href={`${serverURL}/speaker`}
          target='_blank'
          rel='noreferrer'
          className={styles.label}
        >
          Default Presenter
        </a>
      </div>

      <div className={styles.previewItem}>
        <IFrameLoader title='Audience' src={`${serverURL}/public`} />
        <a
          href={`${serverURL}/public`}
          target='_blank'
          rel='noreferrer'
          className={styles.label}
        >
          Audience
        </a>
      </div>

      <div className={styles.previewItem}>
        <IFrameLoader title='Stage Manager' src={`${serverURL}/sm`} />
        <a
          href={`${serverURL}/sm`}
          target='_blank'
          rel='noreferrer'
          className={styles.label}
        >
          Stage Manager
        </a>
      </div>

      <div className={styles.previewItem}>
        <IFrameLoader
          title='Lower third'
          src={`${serverURL}/lower?key=242424`}
        />
        <a
          href={`${serverURL}/lower`}
          target='_blank'
          rel='noreferrer'
          className={styles.label}
        >
          Lower third
        </a>
      </div>
    </div>
  );
}
