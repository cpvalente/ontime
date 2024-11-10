import { CustomFields } from 'ontime-types';

import {
  getTimeOption,
  hideTimerSeconds,
  makeOptionsFromCustomFields,
  showLeadingZeros,
} from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });

  return [
    { section: 'Clock Options' },
    getTimeOption(timeFormat),
    { section: 'Timer Options' },
    hideTimerSeconds,
    showLeadingZeros,
    { section: 'Data sources' },
    {
      id: 'main',
      title: 'Main text',
      description: 'Select the data source for the main text',
      type: 'option',
      values: mainOptions,
      defaultValue: 'Title',
    },
    {
      id: 'secondary-src',
      title: 'Secondary text',
      description: 'Select the data source for the secondary text',
      type: 'option',
      values: secondaryOptions,
      defaultValue: '',
    },
    { section: 'Element visibility' },
    {
      id: 'hideClock',
      title: 'Hide Time Now',
      description: 'Hides the Time Now field',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideCards',
      title: 'Hide Cards',
      description: 'Hides the Now and Next cards',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideProgress',
      title: 'Hide progress bar',
      description: 'Hides the progress bar',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideMessage',
      title: 'Hide Presenter Message',
      description: 'Prevents the screen from displaying messages from the presenter',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideExternal',
      title: 'Hide External',
      description: 'Prevents the screen from displaying the external field',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};
