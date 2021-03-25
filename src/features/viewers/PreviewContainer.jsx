import DefaultPresenter from './DefaultPresenter';
import styles from './PreviewContainer.module.css';
import { AspectRatio } from '@chakra-ui/react';

export default function PreviewContainer() {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewItem}>
        <AspectRatio maxW='300' ratio={16 / 9} className={styles.preview}>
          <iframe src='http://localhost:3000/'></iframe>
        </AspectRatio>
        <div className={styles.label}>Default Presenter</div>
      </div>
      <div className={styles.previewItem}>
        <AspectRatio maxW='300' ratio={16 / 9} className={styles.preview}>
          <iframe src='http://localhost:3000/'></iframe>
        </AspectRatio>
        <div className={styles.label}>Audience</div>
      </div>
      <div className={styles.previewItem}>
        <AspectRatio maxW='300' ratio={16 / 9} className={styles.preview}>
          <iframe src='http://localhost:3000/'></iframe>
        </AspectRatio>
        <div className={styles.label}>Stage Manager</div>
      </div>
      <div className={styles.previewItem}>
        <AspectRatio maxW='300' ratio={16 / 9} className={styles.preview}>
          <iframe src='http://localhost:3000/'></iframe>
        </AspectRatio>
        <div className={styles.label}>Lower third</div>
      </div>
    </div>
  );
}
