import { useMemo } from 'react';

import useInfo from '../../../../common/hooks-query/useInfo';
import useUrlPresets from '../../../../common/hooks-query/useUrlPresets';

import GenerateLinkForm from './GenerateLinkForm';

interface GenerateLinkFormExportProps {
  lockedPath?: { value: string; label: string };
}

export default function GenerateLinkFormExport({ lockedPath }: GenerateLinkFormExportProps) {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets({ skip: lockedPath === undefined });

  const hostOptions = useMemo(
    () =>
      infoData.networkInterfaces.map((nif) => ({
        value: nif.address,
        label: `${nif.name} - ${nif.address}`,
      })),
    [infoData.networkInterfaces],
  );

  const pathOptions = useMemo(() => {
    if (lockedPath) {
      return [{ value: lockedPath.value, label: lockedPath.label }];
    }
    return [
      { value: 'timer', label: 'Timer' },
      { value: 'cuesheet', label: 'Cuesheet' },
      { value: 'op', label: 'Operator' },
      { value: '', label: 'Companion' },
      ...urlPresetData.map((preset) => ({
        value: preset.alias,
        label: `Preset: ${preset.alias}`,
      })),
    ];
  }, [lockedPath, urlPresetData]);

  return <GenerateLinkForm hostOptions={hostOptions} pathOptions={pathOptions} isLockedToView={Boolean(lockedPath)} />;
}
