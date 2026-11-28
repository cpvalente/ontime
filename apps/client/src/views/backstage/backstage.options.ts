import { CustomFields, OntimeEvent, ProjectData } from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption, TimeOptions } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeOptionsFromCustomFields,
  makeProjectDataOptions,
  makeViewParamsReader,
} from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { getScheduleOptions } from '../common/schedule/schedule.options';

export const getBackstageOptions = (
  timeFormat: string,
  customFields: CustomFields,
  projectData: ProjectData,
): ViewOption[] => {
  const customFieldOptions = makeOptionsFromCustomFields(customFields, [{ value: 'none', label: 'None' }]);
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'note', label: 'Note' },
  ]);
  const projectDataOptions = makeProjectDataOptions(projectData, [{ value: 'none', label: 'None' }]);
  const mainOptions = makeOptionsFromCustomFields(customFields, [{ value: 'title', label: 'Title' }]);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'main',
          title: 'Main text',
          type: 'option',
          values: mainOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary text',
          description: 'Shown in the now and next cards',
          type: 'option',
          values: secondaryOptions,
          defaultValue: 'none',
        },
        {
          id: 'extra-info',
          title: 'Extra info',
          description: 'Project data shown in the view',
          type: 'option',
          values: projectDataOptions,
          defaultValue: 'none',
        },
      ],
    },
    getScheduleOptions(customFieldOptions),
  ];
};

type BackstageOptions = {
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  extraInfo: string | null;
} & TimeOptions;

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): BackstageOptions {
  const params = makeViewParamsReader(searchParams, defaultValues);

  return {
    mainSource: params.get('main') as keyof OntimeEvent | null,
    secondarySource: params.get('secondary-src') as keyof OntimeEvent | null,
    extraInfo: params.get('extra-info'),
    timeformat: params.get('timeformat'),
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useBackstageOptions(): BackstageOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
