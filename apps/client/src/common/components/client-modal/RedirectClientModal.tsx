import { useState } from 'react';
import { IoArrowForward } from 'react-icons/io5';

import { navigatorConstants } from '../../../viewerConfig';
import { setClientRemote } from '../../hooks/useSocket';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import Button from '../buttons/Button';
import Info from '../info/Info';
import Input from '../input/input/Input';
import AppLink from '../link/app-link/AppLink';
import Modal from '../modal/Modal';
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
      setRedirect({ target: id, redirect: newPath });
    }

    setRedirect({ target: id, redirect: newPath });
    onClose();
  };

  const enabledPresets = data.filter((preset) => preset.enabled);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      title={`Redirect: ${name}`}
      bodyElements={
        <>
          <Info>
            Remotely redirect the client to a different URL. <br />
            Either by entering a custom path or selecting a URL Preset.
            <br />
            <br />
            <AppLink search='settings=sharing__presets'>Manage URL Presets</AppLink>
          </Info>
          <div className={style.inlineEntry}>
            <span className={style.label}>Enter custom path</span>
            <label className={style.textEntry}>
              {origin}
              <Input placeholder='eg. /timer' fluid value={path} onChange={(event) => setPath(event.target.value)} />
            </label>
            <Button
              variant='primary'
              aria-label='Redirect'
              disabled={path === currentPath || path === ''}
              className={style.redirect}
              onClick={() => handleRedirect(path)}
            >
              Redirect
              <IoArrowForward />
            </Button>
          </div>
          <div>
            <span className={style.label}>Select View or URL Preset</span>
            <div className={style.inlineEntry}>
              <label className={style.textEntry}>
                {origin}
                <Select
                  fluid
                  options={viewOptions}
                  defaultValue={viewOptions[0].value}
                  onValueChange={(value) => setSelected(value)}
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
          </div>
        </>
      }
    />
  );
}
