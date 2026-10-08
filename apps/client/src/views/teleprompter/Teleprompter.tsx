import { OntimeView } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import useTeleprompterScript from '../../common/hooks-query/useTeleprompterScript';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useSelectedEventId, useTeleprompterState } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { sendSocket } from '../../common/utils/socket';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay from './control-overlay/ControlOverlay';
import TransportButtons from './control-overlay/TransportButtons';
import HelpOverlay from './help-overlay/HelpOverlay';
import TransportShortcuts from './help-overlay/TransportShortcuts';
import { useServerClockSync } from './serverClock';
import type { TeleprompterPayload } from './teleprompter.keymap';
import { type TeleprompterOptions, teleprompterOptions, useTeleprompterOptions } from './teleprompter.options';
import { composeFlip, filterToLoadedEvent } from './teleprompter.utils';
import TeleprompterScreen from './TeleprompterScreen';

import './Teleprompter.scss';

export default function Teleprompter() {
  const options = useTeleprompterOptions();
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const [showHelp, setShowHelp] = useState(false);

  useWindowTitle('Teleprompter');
  useServerClockSync();
  useHelpKey(() => setShowHelp((current) => !current));

  const flip = composeFlip(options.flipH, options.flipV, isMirrored);

  return (
    <div
      className={cx(['teleprompter', flip.flipH && 'teleprompter--flip-h', flip.flipV && 'teleprompter--flip-v'])}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor target={OntimeView.Teleprompter} viewOptions={teleprompterOptions} />
      {options.control || options.remoteControl ? (
        <SharedTeleprompter
          options={options}
          isController={options.control}
          isHelpOpen={showHelp}
          onToggleHelp={() => setShowHelp((current) => !current)}
        />
      ) : (
        <EmptyPage text='Turn on Remote screen or Controller in the view options to show the shared teleprompter' />
      )}
      <HelpOverlay
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        note={
          options.control
            ? 'This controller drives every remote screen'
            : 'This screen follows the shared teleprompter. Drive it from a controller view or the integration API'
        }
      >
        {options.control && <TransportShortcuts />}
      </HelpOverlay>
    </div>
  );
}

interface SharedTeleprompterProps {
  options: TeleprompterOptions;
  isController: boolean;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

const sendCommand = (payload: TeleprompterPayload) => sendSocket('teleprompter', payload);

/**
 * Shows the transport the server holds, like every other remote screen
 * A controller also sends commands, which reach every remote screen
 */
function SharedTeleprompter({ options, isController, isHelpOpen, onToggleHelp }: SharedTeleprompterProps) {
  const { data: script, status } = useTeleprompterScript();
  const { data: viewSettings } = useViewSettings();
  const transport = useTeleprompterState();
  const loadedEventId = useSelectedEventId();

  if (!script) {
    if (status === 'error') {
      return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
    }
    return <Loader />;
  }

  const events = options.onlyPlaying ? filterToLoadedEvent(script.events, loadedEventId) : script.events;
  if (events === null) return <EmptyPage text='The playing event has no script' />;
  if (events.length === 0) return <EmptyPage text='There is no script in the field the teleprompter reads' />;

  return (
    <TeleprompterScreen
      events={events}
      charsPerLine={script.charsPerLine}
      transport={transport}
      mode={{ cued: viewSettings.teleprompter.followLoaded }}
      options={options}
      loadedEventId={loadedEventId}
      fallbackRow={options.onlyPlaying ? events[0]?.lines.findIndex((line) => line.kind === 'text') : undefined}
      onCommand={isController ? sendCommand : undefined}
      inputDisabled={isHelpOpen}
    >
      <ControlOverlay transport={transport} onToggleHelp={onToggleHelp}>
        {isController && <TransportButtons transport={transport} onCommand={sendCommand} />}
      </ControlOverlay>
    </TeleprompterScreen>
  );
}

/** Opens the shortcut list with ?, the one key a remote screen answers to */
function useHelpKey(onToggle: () => void) {
  const handler = useRef(onToggle);
  // keeps the latest handler for the listener, which is registered once
  useEffect(() => {
    handler.current = onToggle;
  });

  // listens for the help key, outside of inputs and while the view options are closed
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (useViewParamsEditorStore.getState().isOpen) return;
      if (event.key !== '?' || event.ctrlKey || event.metaKey || event.altKey) return;

      event.preventDefault();
      handler.current();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
