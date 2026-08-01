import { useState } from 'react';
import { IoArrowForward } from 'react-icons/io5';

import { baseURI } from '../../../externals';
import { navigatorConstants } from '../../../viewerConfig';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import { setClientRemote } from '../../hooks/useSocket';
import Button from '../buttons/Button';
import Dialog from '../dialog/Dialog';
import Info from '../info/Info';
import Input from '../input/input/Input';
import ExternalLink from '../link/external-link/ExternalLink';
import Select from '../select/Select';

import style from './RedirectClientModal.module.scss';

interface RedirectClientModalProps {
  id: string;
  name: string;
  currentPath: string;
  origin: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RedirectClientModal({ id, isOpen, name, currentPath, origin, onClose }: RedirectClientModalProps) {
  const { data } = useUrlPresets();
  const [path, setPath] = useState(currentPath);
  const [selected, setSelected] = useState('/');

  const { setRedirect } = setClientRemote;

  const handleRedirect = (newPath: string) => {
    if (newPath === '/' || newPath === currentPath) {
      return;
    }

    if (newPath.startsWith('preset-')) {
      setRedirect({ target: id, redirect: newPath.slice(7) });
    } else {
      setRedirect({ target: id, redirect: newPath });
    }

    onClose();
  };

  const enabledPresets = data.filter((preset) => preset.enabled);
  const settingsUrl = `${window.location.origin}${baseURI}/?settings=sharing__presets`;

  const viewOptions = [
    ...navigatorConstants.map((view) => ({
      value: `/${view.url}`,
      label: view.label,
    })),
    ...enabledPresets.map((preset) => ({
      value: `preset-${preset.alias}`,
      label: `URL Preset: ${preset.alias}`,
    })),
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      title={`Redirect: ${name}`}
      bodyElements={
        <>
          <Info>
            <Info.Body>
              Remotely redirect the client to a different URL. Choose a custom path or select a URL Preset.
            </Info.Body>
            <Info.Footer>
              <ExternalLink href={settingsUrl}>Manage URL Presets</ExternalLink>
            </Info.Footer>
          </Info>
          <section className={style.section}>
            <div className={style.sectionHeader}>
              <span className={style.label}>Enter custom path</span>
              <span className={style.description}>Type the path the client should open.</span>
            </div>
            <div className={style.inlineEntry}>
              <label className={style.textEntry}>
                <span className={style.origin}>{origin}</span>
                <Input placeholder='eg. /timer' fluid value={path} onChange={(event) => setPath(event.target.value)} />
              </label>
              <Button
                variant='primary'
                aria-label='Redirect to custom path'
                disabled={path === currentPath || path === ''}
                className={style.redirect}
                onClick={() => handleRedirect(path)}
              >
                Redirect
                <IoArrowForward />
              </Button>
            </div>
          </section>
          <div className={style.separator} role='separator'>
            <span>Or</span>
          </div>
          <section className={style.section}>
            <div className={style.sectionHeader}>
              <span className={style.label}>Select view or URL Preset</span>
              <span className={style.description}>Choose from the available destinations.</span>
            </div>
            <div className={style.inlineEntry}>
              <label className={style.textEntry}>
                <span className={style.origin}>{origin}</span>
                <Select
                  fluid
                  options={viewOptions}
                  defaultValue={viewOptions[0].value}
                  onValueChange={(value) => {
                    if (value === null) return;
                    setSelected(value);
                  }}
                  disabled={enabledPresets.length === 0}
                />
              </label>
              <Button
                variant='primary'
                aria-label='Redirect to preset'
                className={style.redirect}
                disabled={enabledPresets.length === 0 || selected === '/'}
                onClick={() => handleRedirect(selected)}
              >
                Redirect <IoArrowForward />
              </Button>
            </div>
          </section>
        </>
      }
    />
  );
}
