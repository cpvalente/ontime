import { PropsWithChildren } from 'react';
import { Tooltip } from '@chakra-ui/react';

import { tooltipDelayFast } from '../../../ontimeConfig';

import style from './CopyTag.module.scss';

interface CopyTagProps {
  label?: string;
  className?: string;
}

export default function CopyTag(props: PropsWithChildren<CopyTagProps>) {
  const { label, className, children } = props;

  return (
    <Tooltip label='Click to copy' openDelay={tooltipDelayFast}>
      <button
        className={`${style.copyTag} ${className}`}
        onClick={() => navigator.clipboard.writeText(children as string)}
        tabIndex={-1}
      >
        {label && (
          <span className={style.label}>
            {label}
          </span>
        )}
        <span className={style.text}>
        {children}
        </span>
      </button>
    </Tooltip>
  );
}
