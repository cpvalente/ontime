import { CustomField } from 'ontime-types';
import { findCustomFieldOption } from 'ontime-utils';
import { memo, useRef } from 'react';

import Select from '../../../../common/components/select/Select';
import { makeOptionSelectItems } from '../../../../common/utils/customFieldOptions';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';

import style from './OptionCell.module.scss';

interface OptionCellProps {
  field: Extract<CustomField, { type: 'option' }>;
  value: string;
  readOnly?: boolean;
  handleUpdate: (newValue: string) => void;
}

/**
 * Shows the value of an option field tinted with the option colour, and picks a new one
 */
function OptionCell({ field, value, readOnly, handleUpdate }: OptionCellProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const optionColour = findCustomFieldOption(field, value)?.colour;
  const tint = optionColour ? getAccessibleColour(optionColour) : undefined;

  if (readOnly) {
    return (
      <div className={style.option} style={tint}>
        {value}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <Select
        aria-label={`${field.label} editor`}
        options={makeOptionSelectItems(field, value)}
        value={value || null}
        onValueChange={(newValue) => {
          if (newValue !== null && newValue !== value) handleUpdate(newValue);
        }}
        // return to the cell, so the arrow keys keep moving between cells rather than reopening the menu
        // the select gives focus back to its trigger once closed, so we move on from there in the next frame
        onOpenChangeComplete={(open) => {
          if (open) return;
          requestAnimationFrame(() => {
            if (ref.current?.contains(document.activeElement)) ref.current.closest('td')?.focus();
          });
        }}
        placeholder='Select option'
        triggerClassName={style.option}
        triggerStyle={tint}
        fluid
      />
    </div>
  );
}

export default memo(OptionCell);
