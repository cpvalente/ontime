import { CSSProperties, Fragment } from 'react';
import { CustomFields, OntimeEvent } from 'ontime-types';

import { getAccessibleColour } from '../../../../common/utils/styleUtils';
import { EditorUpdateFields } from '../EventEditor';

import EventEditorImage from './EventEditorImage';
import EventTextArea from './EventTextArea';
import EventTextInput from './EventTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorCustomProps {
  fields: CustomFields;
  event: OntimeEvent;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

export default function EventEditorCustom(props: EventEditorCustomProps) {
  const { fields: customFields, handleSubmit, event } = props;
  return (
    <Fragment>
      {Object.keys(customFields).map((fieldKey) => {
        const key = `${event.id}-${fieldKey}`;
        const fieldName = `custom-${fieldKey}`;
        const initialValue = event.custom[fieldKey] ?? '';
        const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
        const labelText = customFields[fieldKey].label;

        if (customFields[fieldKey].type === 'string') {
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
              <EventTextInput
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
