import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent, ProjectData } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeOptionsFromCustomFields,
  makeProjectDataOptions,
} from '../../common/components/view-params-editor/viewParams.utils';
import { scheduleOptions } from '../common/schedule/schedule.options';

export const getBackstageOptions = (
  timeFormat: string,
  customFields: CustomFields,
  projectData: ProjectData,
): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [{ value: 'note', label: 'Note' }]);
  const projectDataOptions = makeProjectDataOptions(projectData);

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
    scheduleOptions,
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'extra-info',
          title: 'Extra info',
          description: 'Select a project data source to show in the view',
          type: 'option',
          values: projectDataOptions,
          defaultValue: '',
        },
      ],
    },
  ];
};

type BackstageOptions = {
  secondarySource: keyof OntimeEvent | null;
  extraInfo: string | null;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): BackstageOptions {
  // we manually make an object that matches the key above
  return {
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
    extraInfo: searchParams.get('extra-info'),
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useBackstageOptions(): BackstageOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
