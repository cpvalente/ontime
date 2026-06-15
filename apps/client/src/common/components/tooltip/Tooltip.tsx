import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { PropsWithChildren } from 'react';

import { useMountProbe } from '../../devtools/cuesheet-metrics/usePerfMark'; // PERF-METRICS

import style from './Tooltip.module.scss';

interface TooltipProps extends BaseTooltip.Trigger.Props {
  text: string;
}

export default function Tooltip({ text, children, ...triggerProps }: PropsWithChildren<TooltipProps>) {
  useMountProbe('cell.tooltip'); // PERF-METRICS
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
