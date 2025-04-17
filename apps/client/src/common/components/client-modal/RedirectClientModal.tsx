import { useState } from 'react';
import { IoArrowForward } from 'react-icons/io5';
import {
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { NativeSelect } from '@mantine/core';

import { navigatorConstants } from '../../../viewerConfig';
import { setClientRemote } from '../../hooks/useSocket';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import Info from '../info/Info';
import AppLink from '../link/app-link/AppLink';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent maxWidth='max(480px, 35vw)'>
        <ModalHeader>Redirect: {name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
              <NativeSelect
                size='md'
                disabled={enabledPresets.length === 0}
                onChange={(event) => setSelected(event.target.value)}
              >
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
              </NativeSelect>
              <IconButton
                variant='ontime-filled'
                size='md'
                aria-label='Redirect to preset'
                className={style.redirect}
                icon={<IoArrowForward />}
                isDisabled={enabledPresets.length === 0 || selected === '/'}
                onClick={() => handleRedirect(selected)}
              />
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
              isDisabled={path === currentPath || path === ''}
              className={style.redirect}
              icon={<IoArrowForward />}
              onClick={() => handleRedirect(path)}
            />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
