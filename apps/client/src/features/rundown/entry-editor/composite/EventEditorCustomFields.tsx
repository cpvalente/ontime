import { CSSProperties, Fragment } from 'react';
import { CustomFields, OntimeEvent, OntimeGroup, OntimeMilestone } from 'ontime-types';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { EventEditorUpdateFields } from '../EventEditor';

import EventEditorImage from './EventEditorImage';
import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EntryEditorCustomFieldsProps {
  fields: CustomFields;
  entry: OntimeEvent | OntimeGroup | OntimeMilestone;
  handleSubmit: (field: EventEditorUpdateFields, value: string) => void;
}

export default function EntryEditorCustomFields({
  fields: customFields,
  handleSubmit,
  entry,
}: EntryEditorCustomFieldsProps) {
  return (
    <Fragment>
      {Object.keys(customFields).map((fieldKey) => {
        const key = `${entry.id}-${fieldKey}`;
        const fieldName = `custom-${fieldKey}`;
        const initialValue = entry.custom[fieldKey] ?? '';
        const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
        const labelText = customFields[fieldKey].label;

        if (customFields[fieldKey].type === 'text') {
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
        }

        if (customFields[fieldKey].type === 'image') {
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
        }

        // we should have exhausted all types by now
        return null;
      })}
    </Fragment>
  );
}
