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

  /**
   * hostOptions are only used for local networks
   * the NIF address is a local IP address: 192.168.x.x or 10.x.x.x
   * We need to inject the port and protocol to create a valid URL
   * eg: http://192.168.x.x:port
   */
  const hostOptions = useMemo(() => {
    return infoData.networkInterfaces.map((nif) => ({
      value: `http://${nif.address}:${infoData.serverPort}`,
      label: `${nif.name} - ${nif.address}`,
    }));
  }, [infoData.networkInterfaces, infoData.serverPort]);

  const pathOptions = useMemo(() => {
    if (lockedPath) {
      return [{ value: lockedPath.value, label: lockedPath.label }];
    }
    return [
      { value: OntimeView.Timer, label: 'Timer' },
      { value: OntimeView.Cuesheet, label: 'Cuesheet' },
      { value: OntimeView.Operator, label: 'Operator' },
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
