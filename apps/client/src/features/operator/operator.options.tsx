import { CustomFields } from 'ontime-types';

import {
  getTimeOption,
  makeCustomFieldSelectOptions,
  makeOptionsFromCustomFields,
  OptionTitle,
} from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const getOperatorOptions = (customFields: CustomFields, timeFormat: string): ViewOption[] => {
  const fieldOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });
  const customFieldSelect = makeCustomFieldSelectOptions(customFields);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'main',
          title: 'Main data field',
          description: 'Field to be shown in the first line of text',
          type: 'option',
          values: fieldOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary',
          title: 'Secondary data field',
          description: 'Field to be shown in the second line of text',
          type: 'option',
          values: fieldOptions,
          defaultValue: '',
        },
        {
          id: 'subscribe',
          title: 'Highlight Field',
          description: 'Choose a custom field to highlight',
          type: 'multi-option',
          values: customFieldSelect,
        },
        {
          id: 'shouldEdit',
          title: 'Edit custom field',
          description: 'Allows editing an highlighted custom field by long pressing',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hidepast',
          title: 'Hide Past Events',
          description: 'Whether to hide events that have passed',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};
