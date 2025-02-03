import { CustomFields } from 'ontime-types';

import {
  getTimeOption,
  makeOptionsFromCustomFields,
  OptionTitle,
} from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getPublicOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { note: 'Note' });

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'secondary-src',
          title: 'Event secondary text',
          description: 'Select the data source for auxiliary text shown in now and next cards',
          type: 'option',
          values: secondaryOptions,
          defaultValue: '',
        },
      ],
    },
    {
      title: OptionTitle.Schedule,
      collapsible: true,
      options: [
        {
          id: 'eventsPerPage',
          title: 'Events per page',
          description: 'Sets the number of events on the page, can cause overflow',
          type: 'number',
          placeholder: '8 (default)',
        },
        {
          id: 'hidePast',
          title: 'Hide past events',
          description: 'Scheduler will only show upcoming events',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'stopCycle',
          title: 'Stop cycling through event pages',
          description: 'Schedule will not auto-cycle through events',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};
