import { PropsWithChildren, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { IoCopy } from 'react-icons/io5';

import copyToClipboard from '../../utils/copyToClipboard';
import { cx } from '../../utils/styleUtils';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';

import style from './CopyTag.module.scss';

interface CopyTagProps {
  copyValue: string;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function CopyTag({
  copyValue,
  disabled,
  size = 'medium',
  children,
  onClick,
}: PropsWithChildren<CopyTagProps>) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    copyToClipboard(copyValue);
    setCopied(true);

    // reset copied state
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className={style.copytag}>
      {onClick !== undefined ? (
        <Button className={style.action} size={size} tabIndex={-1} onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      ) : (
        <div className={cx([style.label, style[size]])}>{children}</div>
      )}
      <IconButton
        className={style.copy}
        variant='primary'
        size={size}
        tabIndex={-1}
        onClick={handleClick}
        disabled={disabled}
      >
        {copied ? <IoCheckmark /> : <IoCopy />}
      </IconButton>
    </div>
  );
}
