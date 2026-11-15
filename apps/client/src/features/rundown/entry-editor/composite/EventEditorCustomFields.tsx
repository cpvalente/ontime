import { CustomFields, OntimeEvent, OntimeGroup, OntimeMilestone } from 'ontime-types';
import { CSSProperties, Fragment } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Select from '../../../../common/components/select/Select';
import { makeOptionSelectItems } from '../../../../common/utils/customFieldOptions';
import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { EventEditorUpdateFields } from '../EventEditor';
import EventEditorImage from './EventEditorImage';
import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EntryEditorCustomFieldsProps {
  customFields: CustomFields;
  entry: OntimeEvent | OntimeGroup | OntimeMilestone;
  handleSubmit: (field: EventEditorUpdateFields, value: string) => void;
}

export default function EntryEditorCustomFields({ customFields, handleSubmit, entry }: EntryEditorCustomFieldsProps) {
  return (
    <Fragment>
      {customFields.map((field) => {
        const key = `${entry.id}-${field.key}`;
        const fieldName = `custom-${field.key}`;
        const initialValue = entry.custom[field.key] ?? '';
        const { backgroundColor, color } = getAccessibleColour(field.colour);
        const labelText = field.label;

        switch (field.type) {
          case 'text':
            return (
              <EventTextArea
                key={key}
                field={fieldName}
                label={labelText}
                initialValue={initialValue}
                submitHandler={handleSubmit}
                className={style.decorated}
                style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
              />
            );
          case 'image':
            return (
              <div key={key} className={style.customImage}>
                <EntryEditorTextInput
                  key={key}
                  field={fieldName}
                  label={labelText}
                  initialValue={initialValue}
                  placeholder='Paste image URL'
                  submitHandler={handleSubmit}
                  className={style.decorated}
                  maxLength={255}
                  style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
                />
                <EventEditorImage src={initialValue} />
              </div>
            );
          case 'option':
            return (
              <div key={key}>
                <Editor.Label
                  htmlFor={fieldName}
                  className={style.decorated}
                  style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
                >
                  {labelText}
                </Editor.Label>
                <Select
                  id={fieldName}
                  options={makeOptionSelectItems(field, initialValue)}
                  value={initialValue || null}
                  placeholder='Select an option'
                  onValueChange={(value) => {
                    if (value !== null && value !== initialValue) handleSubmit(fieldName, value);
                  }}
                  fluid
                />
              </div>
            );
        }
      })}
    </Fragment>
  );
}
