import { useMemo } from 'react';
import { OntimeView } from 'ontime-types';

import useInfo from '../../common/hooks-query/useInfo';
import useUrlPresets from '../../common/hooks-query/useUrlPresets';

import GenerateLinkForm from './GenerateLinkForm';

interface GenerateLinkFormExportProps {
  lockedPath?: { value: OntimeView; label: string };
}

export default function GenerateLinkFormExport({ lockedPath }: GenerateLinkFormExportProps) {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets({ skip: lockedPath === undefined });

  const hostOptions = useMemo(() => {
    return infoData.networkInterfaces.map((nif) => ({
      value: nif.address,
      label: `${nif.name} - ${nif.address}`,
    }));
  }, [infoData.networkInterfaces]);

  const pathOptions = useMemo(() => {
    if (lockedPath) {
      return [{ value: lockedPath.value, label: lockedPath.label }];
    }
    return [
      { value: OntimeView.Timer, label: 'Timer' },
      { value: OntimeView.Cuesheet, label: 'Cuesheet' },
      { value: OntimeView.Operator, label: 'Operator' },
      { value: '', label: 'Companion' },
      ...urlPresetData.map((preset) => ({
        value: `preset-${preset.alias}`,
        label: `URL Preset: ${preset.alias}`,
      })),
    ];
  }, [lockedPath, urlPresetData]);

  return (
    <GenerateLinkForm
      hostOptions={hostOptions}
      pathOptions={pathOptions}
      presets={urlPresetData}
      isLockedToView={Boolean(lockedPath)}
    />
  );
}
