import { OntimeView, URLPreset } from 'ontime-types';
import { useSearchParams } from 'react-router';

import { useViewUrlPresets } from '../../hooks-query/useUrlPresets';
import { stripReservedParams } from '../../stores/savedViewParams';

/** Normalises a search string so presets can be compared regardless of parameter order */
function normaliseParams(search: string): string {
  const params = new URLSearchParams(stripReservedParams(search));
  params.sort();
  return params.toString();
}

interface AppliedPreset {
  /** presets which target the current view */
  viewPresets: URLPreset[];
  /** the preset the view is currently showing, if any */
  appliedPreset: URLPreset | undefined;
  /** whether the view parameters have moved on from the applied preset */
  hasDrifted: boolean;
  /** the current view customisation, without auth and preset markers */
  currentParams: string;
}

/**
 * Resolves the relation between the current view parameters and the saved URL presets.
 * A preset is applied by marking its alias in the URL, the parameters can then be edited freely.
 */
export function useAppliedPreset(target: OntimeView): AppliedPreset {
  const { viewPresets } = useViewUrlPresets(target);
  const [searchParams] = useSearchParams();

  const currentParams = stripReservedParams(searchParams.toString());
  const appliedPreset = viewPresets.find((preset) => preset.alias === searchParams.get('alias'));
  const hasDrifted =
    appliedPreset !== undefined && normaliseParams(appliedPreset.search) !== normaliseParams(currentParams);

  return { viewPresets, appliedPreset, hasDrifted, currentParams };
}
