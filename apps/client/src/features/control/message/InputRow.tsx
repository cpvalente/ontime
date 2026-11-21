import { PropsWithChildren } from 'react';
import { IoCheckmark, IoEye, IoEyeOffOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import { cx } from '../../../common/utils/styleUtils';

import style from './InputRow.module.scss';

interface InputRowProps {
  label: string;
  isLive: boolean;
  /** the field holds a change that is not on screen yet */
  isPending: boolean;
  onButtonClick: () => void;
  'data-testid'?: string;
}

export default function InputRow(props: PropsWithChildren<InputRowProps>) {
  const { label, isLive, isPending, onButtonClick, children, 'data-testid': testId } = props;

  const subject = label.toLowerCase();
  const buttonLabel = isPending ? `Apply ${subject}` : `Toggle ${subject} visibility`;

  return (
    <div className={style.row}>
      <span className={style.labelRow}>
        <span className={cx([style.label, isLive && style.active])}>{label}</span>
        {isPending && (
          <span className={style.pendingHint}>
            <span className={style.keyHint}>Enter to apply</span>
            <span className={style.touchHint}>Tap ✓ to apply</span>
          </span>
        )}
      </span>
      <div className={style.inputItems}>
        <div className={cx([style.field, isPending && style.pending])}>{children}</div>
        <IconButton
          aria-label={buttonLabel}
          title={buttonLabel}
          onClick={onButtonClick}
          variant={isLive ? 'primary' : 'subtle'}
          className={cx([isPending && style.pending])}
          data-testid={testId}
        >
          {isPending ? <IoCheckmark /> : isLive ? <IoEye /> : <IoEyeOffOutline />}
        </IconButton>
      </div>
    </div>
  );
}
