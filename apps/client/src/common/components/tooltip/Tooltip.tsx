import { PropsWithChildren } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';

import style from './Tooltip.module.scss';

interface TooltipProps extends BaseTooltip.Trigger.Props {
  text: string;
}

export default function Tooltip({ text, children, ...triggerProps }: PropsWithChildren<TooltipProps>) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger {...triggerProps}>{children}</BaseTooltip.Trigger>
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side='bottom' sideOffset={4}>
          <BaseTooltip.Popup className={style.tooltip}>
            <BaseTooltip.Arrow />
            {text}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
