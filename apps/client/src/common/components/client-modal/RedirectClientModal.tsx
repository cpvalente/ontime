import { useState } from 'react';
import { IoArrowForward } from 'react-icons/io5';

import { navigatorConstants } from '../../../viewerConfig';
import { setClientRemote } from '../../hooks/useSocket';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import Info from '../info/Info';
import AppLink from '../link/app-link/AppLink';
import Modal from '../modal/Modal';
import Input from '../input/input/Input';
import Select from '../select/Select';
import IconButton from '../buttons/IconButton';

import style from './RedirectClientModal.module.scss';

interface RedirectClientModalProps {
  id: string;
  name: string;
  currentPath: string;
  origin: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RedirectClientModal(props: RedirectClientModalProps) {
  const { id, isOpen, name, currentPath, origin, onClose } = props;
  const { data } = useUrlPresets();
  const [path, setPath] = useState(currentPath);
  const [selected, setSelected] = useState('/');

  const { setRedirect } = setClientRemote;

  const handleRedirect = (newPath: string) => {
    if (newPath === '/' || newPath === currentPath) {
      return;
    }
    setRedirect({ target: id, redirect: newPath });
    onClose();
  };

  const enabledPresets = data.filter((preset) => preset.enabled);

  const bodyElements = (
    <>
      <Info>
        Remotely redirect the client to a different URL. <br />
        Either by selecting a URL Preset or entering a custom path.
        <br />
        <br />
        <AppLink search='settings=feature_settings__urlpresets'>Manage URL Presets</AppLink>
      </Info>
      <div>
        <span className={style.label}>Select View or URL Preset</span>
        <div className={style.textEntry}>
          <Select
            options={[
              { value: '/', label: 'Select view or preset' },
              ...navigatorConstants.map((view) => ({
                value: `/${view.url}`,
                label: view.label,
              })),
              ...enabledPresets.map((preset) => ({
                value: preset.pathAndParams,
                label: `Preset: ${preset.alias}`,
              })),
            ]}
            value={selected}
            onChange={(value) => setSelected(value)}
            // isDisabled={enabledPresets.length === 0} // Select doesn't have isDisabled, but options can be disabled
          />
          <IconButton
            variant='primary' // Assuming 'ontime-filled' corresponds to 'primary'
            size='medium' // Assuming 'md' corresponds to 'medium'
            aria-label='Redirect to preset'
            className={style.redirect}
            disabled={enabledPresets.length === 0 || selected === '/'}
            onClick={() => handleRedirect(selected)}
          >
            <IoArrowForward />
          </IconButton>
        </div>
      </div>
      <div className={style.inlineEntry}>
        <span className={style.label}>Enter custom path</span>
        <label className={style.textEntry}>
          {origin}
          <Input
            variant='subtle' // Assuming 'ontime-filled' corresponds to 'subtle' or default
            height='medium' // Assuming 'md' corresponds to 'medium'
            placeholder='eg. /minimal?key=0000ffff'
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
        </label>
        <IconButton
          variant='primary' // Assuming 'ontime-filled' corresponds to 'primary'
          size='medium' // Assuming 'md' corresponds to 'medium'
          aria-label='Redirect'
          disabled={path === currentPath || path === ''}
          className={style.redirect}
          onClick={() => handleRedirect(path)}
        >
          <IoArrowForward />
        </IconButton>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={`Redirect: ${name}`}
      onClose={onClose}
      bodyElements={bodyElements}
      showCloseButton
      // maxWidth='max(480px, 35vw)' // This needs to be handled by Modal's internal styling or a wrapper
    />
  );
}
