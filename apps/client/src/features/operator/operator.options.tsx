import { CustomFields, OntimeEvent } from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeCustomFieldSelectOptions,
  makeOptionsFromCustomFields,
  makeViewParamsReader,
} from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../../views/common/viewUtils';

export const getOperatorOptions = (customFields: CustomFields, timeFormat: string): ViewOption[] => {
  const fieldOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
  ]);
  const customFieldSelect = makeCustomFieldSelectOptions(customFields);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'main',
          title: 'Main text',
          description: 'First line of each event',
          type: 'option',
          values: fieldOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary text',
          description: 'Second line of each event',
          type: 'option',
          values: fieldOptions,
          defaultValue: 'none',
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'shouldEdit',
          title: 'Edit custom field',
          description: 'Allows editing a highlighted custom field by long pressing',
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
          id: 'subscribe',
          title: 'Show custom fields',
          description: 'Custom fields shown on each event',
          type: 'multi-option',
          values: customFieldSelect,
        },
        {
          id: 'hidePast',
          title: 'Hide past events',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'showStart',
          title: 'Show planned start',
          description: 'Prepends the planned start to each event',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type OperatorOptions = {
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  subscribe: string[];
  shouldEdit: boolean;
  hidePast: boolean;
  showStart: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): OperatorOptions {
  const params = makeViewParamsReader(searchParams, defaultValues);

  // we manually make an object that matches the key above
  return {
    mainSource: params.get('main') as keyof OntimeEvent | null,
    secondarySource: params.get('secondary-src') as keyof OntimeEvent | null,
    subscribe: params.getAll('subscribe'),
    shouldEdit: isStringBoolean(params.get('shouldEdit')),
    hidePast: isStringBoolean(params.get('hidePast')),
    showStart: isStringBoolean(params.get('showStart')),
  };
}

/**
 * Hook exposes the operator view options
 */
export function useOperatorOptions(): OperatorOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
