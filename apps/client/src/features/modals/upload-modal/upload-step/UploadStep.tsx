import { IoCheckmarkCircle } from '@react-icons/all-files/io5/IoCheckmarkCircle';
import { IoChevronForward } from '@react-icons/all-files/io5/IoChevronForward';
import { IoEllipseOutline } from '@react-icons/all-files/io5/IoEllipseOutline';

import type { UploadStep } from '../UploadModal';

import style from './UploadStep.module.scss';

export default function UploadStepTracker({ uploadStep }: { uploadStep: UploadStep }) {
  const isImporting = uploadStep === 'import';
  const isReview = uploadStep === 'review';

  return (
    <div className={style.stepRow}>
      <div className={isImporting ? style.active : style.idle}>
        <IoCheckmarkCircle />
        Import
      </div>
      <IoChevronForward className={isReview ? style.activeIcon : style.inactiveIcon} />
      <div className={isReview ? style.active : style.inactive}>
        {isReview ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
        Review
      </div>
    </div>
  );
}
