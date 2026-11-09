import { CSSProperties, memo } from 'react';

import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { AppMode } from '../../../../ontimeConfig';
import { usePersistedCuesheetOptions } from '../../cuesheet.options';
import type { CuesheetColumn, CuesheetTableMeta } from '../cuesheetTable.features';

import style from './DelayRow.module.scss';

interface DelayRowProps {
  duration: number;
  injectedStyles?: CSSProperties;
  hasCursor?: boolean;
  options: CuesheetTableMeta['options'];
  visibleColumns: CuesheetColumn[];
}

function DelayRow({ duration, injectedStyles, hasCursor, options, visibleColumns, ...virtuosoProps }: DelayRowProps) {
  const hideDelays = usePersistedCuesheetOptions((state) => state.hideDelays);

  if (hideDelays || duration === 0) {
    return (
      <tr
        className={`${style.delayRow} ${style.delayRowHidden}`}
        data-testid='cuesheet-delay-hidden'
        data-hidden-delay
        style={injectedStyles}
        {...virtuosoProps}
      >
        <td />
      </tr>
    );
  }

  const delayTime = millisToDelayString(duration, 'expanded');

  return (
    <tr
      className={style.delayRow}
      data-testid='cuesheet-delay'
      style={injectedStyles}
      data-cursor={hasCursor}
      {...virtuosoProps}
    >
      {options.cuesheetMode === AppMode.Edit && <td className={style.actionColumn} tabIndex={-1} />}
      {!options.hideIndexColumn && <td className={style.indexColumn} tabIndex={-1} />}
      {visibleColumns.map((column, index) => (
        <td key={column.id} tabIndex={-1} style={{ width: `calc(var(--col-${column.id}-size) * 1px)` }}>
          {index === 0 && (
            <span className={style.label}>
              <span>{delayTime}</span>
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

export default memo(DelayRow);
