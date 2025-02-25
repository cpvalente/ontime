import { useState } from 'react';
import { IoArrowForward } from 'react-icons/io5';
import { Input } from '@chakra-ui/react';

import { navigatorConstants } from '../../../viewerConfig';
import { setClientRemote } from '../../hooks/useSocket';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import Info from '../info/Info';
import { DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogHeader, DialogRoot } from '../ui/dialog';
import { IconButton } from '../ui/icon-button';
import { NativeSelectField, NativeSelectRoot } from '../ui/native-select';

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
    console.log('----> redirect to', newPath);
    setRedirect({ target: id, redirect: newPath });
    onClose();
  };

  const enabledPresets = data.filter((preset) => preset.enabled);

  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <DialogBackdrop />
      <DialogContent maxWidth='max(480px, 35vw)'>
        <DialogHeader>Redirect: {name}</DialogHeader>
        <DialogCloseTrigger />
        <DialogContent>
          <DialogBody>
            <Info>
              Remotely redirect the client to a different URL. <br />
              Either by selecting a URL Preset or entering a custom path.
              <br />
              <br />
              <a href='/editor?settings=feature_settings__urlpresets' target='_blank' className={style.link}>
                Manage URL Presets
              </a>
            </Info>
            <div>
              <span className={style.label}>Select View or URL Preset</span>
              <div className={style.textEntry}>
                <NativeSelectRoot size='sm' disabled={enabledPresets.length === 0}>
                  <NativeSelectField onChange={(event) => setSelected(event.target.value)}>
                    <option value='/'>Select view or preset</option>
                    {navigatorConstants.map((view) => {
                      return (
                        <option key={view.url} value={`/${view.url}`}>
                          {view.label}
                        </option>
                      );
                    })}
                    {enabledPresets.map((preset) => {
                      return (
                        <option key={preset.pathAndParams} value={preset.pathAndParams}>
                          {`Preset: ${preset.alias}`}
                        </option>
                      );
                    })}
                  </NativeSelectField>
                </NativeSelectRoot>
                <IconButton
                  variant='ontime-filled'
                  size='md'
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
                  variant='ontime-filled'
                  size='md'
                  placeholder='eg. /minimal?key=0000ffff'
                  value={path}
                  onChange={(event) => setPath(event.target.value)}
                />
              </label>
              <IconButton
                variant='ontime-filled'
                size='md'
                aria-label='Redirect'
                disabled={path === currentPath || path === ''}
                className={style.redirect}
                onClick={() => handleRedirect(path)}
              >
                <IoArrowForward />
              </IconButton>
            </div>
          </DialogBody>
        </DialogContent>
      </DialogContent>
    </DialogRoot>
  );
}
