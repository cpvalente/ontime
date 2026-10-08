import { type EntryId, OntimeView, type TeleprompterScript, type TeleprompterState } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import useCustomFields from '../../common/hooks-query/useCustomFields';
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
import { getTeleprompterOptions, type TeleprompterOptions, useTeleprompterOptions } from './teleprompter.options';
import { composeFlip, filterToLoadedEvent } from './teleprompter.utils';
import TeleprompterScreen from './TeleprompterScreen';
import { useLocalTransport } from './useLocalTransport';

import './Teleprompter.scss';

const helpNotes = {
  remote: 'This screen follows the shared teleprompter. Drive it from a controller view or the integration API',
  controller: 'This controller drives every remote screen',
  local: 'This view runs on its own, the keys act on it alone',
};

export default function Teleprompter() {
  const options = useTeleprompterOptions();
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const { data: viewSettings } = useViewSettings();
  const { data: customFields } = useCustomFields();
  const [showHelp, setShowHelp] = useState(false);

  useWindowTitle('Teleprompter');
  useServerClockSync();
  useHelpKey(() => setShowHelp((current) => !current));

  const kind = options.control ? 'controller' : options.remoteControl ? 'remote' : 'local';
  const flip = composeFlip(options.flipH, options.flipV, isMirrored);
  const toggleHelp = () => setShowHelp((current) => !current);

  return (
    <div
      className={cx(['teleprompter', flip.flipH && 'teleprompter--flip-h', flip.flipV && 'teleprompter--flip-v'])}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor
        target={OntimeView.Teleprompter}
        viewOptions={getTeleprompterOptions(customFields, viewSettings.teleprompter)}
      />
      {kind === 'local' ? (
        <LocalTeleprompter
          options={options}
          sharedFollowLoaded={viewSettings.teleprompter.followLoaded}
          isHelpOpen={showHelp}
          onToggleHelp={toggleHelp}
        />
      ) : (
        <SharedTeleprompter
          options={options}
          isController={kind === 'controller'}
          cued={viewSettings.teleprompter.followLoaded}
          isHelpOpen={showHelp}
          onToggleHelp={toggleHelp}
        />
      )}
      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} note={helpNotes[kind]}>
        {kind !== 'remote' && <TransportShortcuts />}
      </HelpOverlay>
    </div>
  );
}

interface TeleprompterViewProps {
  options: TeleprompterOptions;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

const sendCommand = (payload: TeleprompterPayload) => sendSocket('teleprompter', payload);

/**
 * Shows the transport the server holds, like every other remote screen
 * A controller also sends commands, which reach every remote screen
 */
function SharedTeleprompter({
  options,
  isController,
  cued,
  isHelpOpen,
  onToggleHelp,
}: TeleprompterViewProps & { isController: boolean; cued: boolean }) {
  const { data: script, status } = useTeleprompterScript();
  const transport = useTeleprompterState();

  return (
    <ScriptContent
      script={script}
      status={status}
      transport={transport}
      cued={cued}
      options={options}
      onCommand={isController ? sendCommand : undefined}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

/** Runs the same transport in the browser, over a script fetched with the view's own options */
function LocalTeleprompter({
  options,
  sharedFollowLoaded,
  isHelpOpen,
  onToggleHelp,
}: TeleprompterViewProps & { sharedFollowLoaded: boolean }) {
  const { data: script, status } = useTeleprompterScript(options.scriptSearch);
  const loadedEventId = useSelectedEventId();
  const cued = options.followLoaded ?? sharedFollowLoaded;
  const { state, handleCommand, moveToRow } = useLocalTransport({
    events: script?.events ?? noEvents,
    cued,
    initialSpeed: options.speed,
    loadedEventId,
  });

  return (
    <ScriptContent
      script={script}
      status={status}
      transport={state}
      cued={cued}
      options={options}
      onCommand={handleCommand}
      onUserScroll={moveToRow}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

const noEvents: TeleprompterScript['events'] = [];

interface ScriptContentProps {
  script: TeleprompterScript | undefined;
  status: 'pending' | 'error' | 'success';
  transport: TeleprompterState;
  cued: boolean;
  options: TeleprompterOptions;
  onCommand?: (payload: TeleprompterPayload) => void;
  onUserScroll?: (row: number) => void;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

function ScriptContent({
  script,
  status,
  transport,
  cued,
  options,
  onCommand,
  onUserScroll,
  isHelpOpen,
  onToggleHelp,
}: ScriptContentProps) {
  const loadedEventId: EntryId | null = useSelectedEventId();

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
      mode={{ cued }}
      options={options}
      loadedEventId={loadedEventId}
      fallbackRow={options.onlyPlaying ? events[0]?.lines.findIndex((line) => line.kind === 'text') : undefined}
      onCommand={onCommand}
      onUserScroll={onUserScroll}
      inputDisabled={isHelpOpen}
    >
      <ControlOverlay transport={transport} onToggleHelp={onToggleHelp}>
        {onCommand && <TransportButtons transport={transport} onCommand={onCommand} />}
      </ControlOverlay>
    </TeleprompterScreen>
  );
}

/** Opens the shortcut list with ?, the one key every teleprompter view answers to */
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
