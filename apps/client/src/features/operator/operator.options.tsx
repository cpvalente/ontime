import { CustomFields } from 'ontime-types';

import { getTimeOption, makeOptionsFromCustomFields } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const getOperatorOptions = (customFields: CustomFields, timeFormat: string): ViewOption[] => {
  const fieldOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });

  const customFieldSelect = Object.entries(customFields).map(([_key, value]) => ({
    value: value.label,
    label: value.label,
  }));

  return [
    { section: 'Clock Options' },
    getTimeOption(timeFormat),
    { section: 'Data sources' },

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
    { section: 'Element visibility' },
    {
      id: 'hidepast',
      title: 'Hide Past Events',
      description: 'Whether to hide events that have passed',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'shouldEdit',
      title: 'Edit custom field',
      description: 'Allows editing an events selected custom field by long pressing.',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};
