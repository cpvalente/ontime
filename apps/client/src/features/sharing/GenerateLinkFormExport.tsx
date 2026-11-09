import { OntimeView } from 'ontime-types';
import { useMemo } from 'react';

import useInfo from '../../common/hooks-query/useInfo';
import useUrlPresets from '../../common/hooks-query/useUrlPresets';
import { hostToBaseUrl } from '../../common/utils/linkUtils';
import { serverURL } from '../../externals';
import { navigatorConstants, viewLabels } from '../../viewerConfig';
import GenerateLinkForm from './GenerateLinkForm';

interface GenerateLinkFormExportProps {
  lockedPath?: { value: OntimeView; label: string };
}

export default function GenerateLinkFormExport({ lockedPath }: GenerateLinkFormExportProps) {
  const { data: infoData } = useInfo();
  const { data: urlPresetData } = useUrlPresets({ skip: lockedPath === undefined });

  // Keep the working server address available alongside explicitly selectable network interfaces.
  const hostOptions = useMemo(() => {
    const interfaces = infoData.networkInterfaces.map((nif) => ({
      value: hostToBaseUrl(nif.address, infoData.serverPort),
      label: `${nif.name} - ${nif.address}`,
    }));
    return [
      { value: serverURL, label: `Current address (${new URL(serverURL).host})` },
      ...interfaces.filter((option) => option.value !== serverURL),
    ];
  }, [infoData.networkInterfaces, infoData.serverPort]);

  const pathOptions = useMemo(() => {
    if (lockedPath) {
      return [{ value: lockedPath.value, label: lockedPath.label }];
    }
    return [
      ...navigatorConstants.map((view) => ({ value: view.url, label: view.label })),
      { value: OntimeView.Cuesheet, label: viewLabels[OntimeView.Cuesheet] },
      { value: OntimeView.Operator, label: viewLabels[OntimeView.Operator] },
      { value: '<<companion>>', label: 'Companion' },
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
