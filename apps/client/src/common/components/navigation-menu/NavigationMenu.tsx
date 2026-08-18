import { Dialog } from '@base-ui/react/dialog';
import { useDisclosure, useFullscreenDocument } from '@mantine/hooks';
import { memo, PropsWithChildren } from 'react';
import { IoClose, IoExpand, IoLockClosedOutline, IoPencilOutline, IoSwapVertical } from 'react-icons/io5';
import { LuCoffee } from 'react-icons/lu';
import { useLocation } from 'react-router';

import { isLocalhost, supportsFullscreen } from '../../../externals';
import { canUseWakeLock, useKeepAwakeOptions } from '../../../features/keep-awake/useWakeLock';
import { navigatorConstants } from '../../../viewerConfig';
import useUrlPresets from '../../hooks-query/useUrlPresets';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import { useClientStore } from '../../stores/clientStore';
import { useViewOptionsStore } from '../../stores/viewOptions';
import IconButton from '../buttons/IconButton';
import { RenameClientModal } from '../client-modal/RenameClientModal';
import Eyebrow from '../eyebrow/Eyebrow';
import ClientLink from './client-link/ClientLink';
import EditorNavigation from './editor-navigation/EditorNavigation';
import NavigationMenuItem from './navigation-menu-item/NavigationMenuItem';
import NavigationMenuToggle from './navigation-menu-item/NavigationMenuToggle';
import OtherAddresses from './other-addresses/OtherAddresses';

import style from './NavigationMenu.module.scss';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default memo(NavigationMenu);
function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const id = useClientStore((store) => store.id);
  const name = useClientStore((store) => store.name);
  const isSmallScreen = useIsSmallScreen();

  const [isRenameOpen, handlers] = useDisclosure(false);
  const { fullscreen, toggle } = useFullscreenDocument();
  const { mirror, toggleMirror } = useViewOptionsStore();
  const { keepAwake, toggleKeepAwake } = useKeepAwakeOptions();
  const location = useLocation();

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={style.backdrop} />
        <RenameClientModal id={id} name={name} isOpen={isRenameOpen} onClose={handlers.close} />
        <Dialog.Popup className={style.drawer}>
          <div className={style.header}>
            <div className={style.headerText}>
              <Dialog.Title className={style.title}>Ontime</Dialog.Title>
              {name && <span className={style.clientName}>{name}</span>}
            </div>
            <IconButton variant='subtle-white' size='large' aria-label='Close menu' onClick={onClose}>
              <IoClose />
            </IconButton>
          </div>
          <div className={style.body}>
            <MenuGroup label='This screen'>
              {supportsFullscreen && (
                <NavigationMenuToggle checked={fullscreen} icon={<IoExpand />} label='Fullscreen' onToggle={toggle} />
              )}
              <NavigationMenuToggle
                checked={mirror}
                icon={<IoSwapVertical />}
                label='Flip Screen'
                onToggle={() => toggleMirror()}
              />
              {canUseWakeLock && (
                <NavigationMenuToggle
                  checked={keepAwake}
                  icon={<LuCoffee />}
                  label='Keep Awake'
                  onToggle={toggleKeepAwake}
                />
              )}
              <NavigationMenuItem onClick={handlers.open}>
                <IoPencilOutline />
                Rename Client
              </NavigationMenuItem>
            </MenuGroup>

            <MenuGroup label='Ontime app'>
              <EditorNavigation />
              <ClientLink
                to='cuesheet'
                current={location.pathname === '/cuesheet'}
                postAction={isSmallScreen ? onClose : undefined}
              >
                <IoLockClosedOutline />
                Cuesheet
              </ClientLink>
              <ClientLink
                to='op'
                current={location.pathname === '/op'}
                postAction={isSmallScreen ? onClose : undefined}
              >
                <IoLockClosedOutline />
                Operator
              </ClientLink>
            </MenuGroup>

            <MenuGroup label='Views'>
              {navigatorConstants.map((route) => (
                <ClientLink
                  key={route.url}
                  to={route.url}
                  current={location.pathname === `/${route.url}`}
                  postAction={isSmallScreen ? onClose : undefined}
                >
                  {route.label}
                </ClientLink>
              ))}
            </MenuGroup>

            <PresetNavigation isSmallScreen={isSmallScreen} onClose={onClose} />
          </div>

          {isLocalhost && <OtherAddresses currentLocation={location.pathname} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuGroup({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className={style.group}>
      <div className={style.groupLabel}>
        <Eyebrow>{label}</Eyebrow>
      </div>
      {children}
    </div>
  );
}

function PresetNavigation({ isSmallScreen, onClose }: { isSmallScreen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { data: urlPresets } = useUrlPresets();
  const navPresets = urlPresets.filter((preset) => preset.enabled && preset.displayInNav);

  if (navPresets.length === 0) return null;

  return (
    <MenuGroup label='Presets'>
      {navPresets.map((preset) => (
        <ClientLink
          key={preset.alias}
          to={`preset/${preset.alias}`}
          current={location.pathname === `/preset/${preset.alias}`}
          postAction={isSmallScreen ? onClose : undefined}
        >
          {preset.alias}
        </ClientLink>
      ))}
    </MenuGroup>
  );
}
