import {
  type EntryId,
  OntimeView,
  type TeleprompterAnchor,
  type TeleprompterScript,
  type TeleprompterState,
  type TeleprompterSync,
} from 'ontime-types';
import { makeTeleprompterLayout } from 'ontime-utils';
import { useEffect, useMemo, useRef, useState } from 'react';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useTeleprompterScript from '../../common/hooks-query/useTeleprompterScript';
import useTeleprompterSettings from '../../common/hooks-query/useTeleprompterSettings';
import { useSelectedEventId, useTeleprompterState, useTeleprompterSync } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { sendSocket } from '../../common/utils/socket';
import { cx } from '../../common/utils/styleUtils';
import Loader from '../common/loader/Loader';
import ControlOverlay, { type LoadedEvent } from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import TransportShortcuts from './help-overlay/TransportShortcuts';
import type { TeleprompterViewCommand } from './teleprompter.keymap';
import {
  getTeleprompterOptions,
  type TeleprompterOptions,
  type TeleprompterRole,
  useTeleprompterOptions,
} from './teleprompter.options';
import { composeFlip, filterToLoadedEvent, toTeleprompterPayload } from './teleprompter.utils';
import TeleprompterScreen from './TeleprompterScreen';
import { useLocalTransport } from './useLocalTransport';
import { isTypingTarget } from './useTeleprompterInput';

import './Teleprompter.scss';

const helpNotes: Record<TeleprompterRole, string> = {
  remote:
    'This view shows the same line as every controller and following view. Drive it from a controller view, Companion or the integration API',
  controller: 'This controller drives every following view. What you see here is what they show',
  local: 'This view plays on its own. Its keys and buttons only move this view',
};

export default function Teleprompter() {
  const options = useTeleprompterOptions();
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const { data: settings } = useTeleprompterSettings();
  const { data: customFields } = useCustomFields();
  const [showHelp, setShowHelp] = useState(false);

  useWindowTitle('Teleprompter');
  useViewKeys(() => setShowHelp((current) => !current));

  const { role } = options;
  const flip = composeFlip(options.flipH, options.flipV, isMirrored);
  const toggleHelp = () => setShowHelp((current) => !current);

  return (
    <div
      className={cx(['teleprompter', flip.flipH && 'teleprompter--flip-h', flip.flipV && 'teleprompter--flip-v'])}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor target={OntimeView.Teleprompter} viewOptions={getTeleprompterOptions(customFields, settings)} />
      {role === 'local' ? (
        <LocalTeleprompter options={options} isHelpOpen={showHelp} onToggleHelp={toggleHelp} />
      ) : (
        <SharedTeleprompter options={options} isHelpOpen={showHelp} onToggleHelp={toggleHelp} />
      )}
      {role === 'controller' && (
        <div className='teleprompter__badge' data-testid='teleprompter-badge'>
          Controller · drives every following view
        </div>
      )}
      <HelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} note={helpNotes[role]}>
        {role !== 'remote' && <TransportShortcuts />}
      </HelpOverlay>
    </div>
  );
}

interface TeleprompterViewProps {
  options: TeleprompterOptions;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

const sendCommand = (command: TeleprompterViewCommand) => sendSocket('teleprompter', toTeleprompterPayload(command));

/**
 * Shows the transport the server holds, which Companion and the integration API drive
 * It shows what the server publishes, and reads from the position the server calculates, in rows of the script
 * A controller also sends commands, which reach every following view
 */
function SharedTeleprompter({ options, isHelpOpen, onToggleHelp }: TeleprompterViewProps) {
  const { data: script, status } = useTeleprompterScript();
  const state = useTeleprompterState();
  const sync = useTeleprompterSync();
  const isController = options.role === 'controller';

  return (
    <ScriptContent
      script={script}
      status={status}
      state={state}
      sync={sync}
      // until the script and the sync count the same rows, the screen holds its place
      isBehind={script?.revision !== sync.revision}
      options={options}
      onCommand={isController ? sendCommand : undefined}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

/** Runs the same transport in the browser, over the same script */
function LocalTeleprompter({ options, isHelpOpen, onToggleHelp }: TeleprompterViewProps) {
  const { data: script, status } = useTeleprompterScript();
  const loadedEventId = useSelectedEventId();
  const { sync, isBehind, state, handleCommand, moveToAnchor } = useLocalTransport({
    events: script?.events ?? noEvents,
    revision: script?.revision ?? 0,
    initialMode: options.mode,
    initialSpeed: options.speed,
    loadedEventId,
  });

  return (
    <ScriptContent
      script={script}
      status={status}
      state={state}
      sync={sync}
      isBehind={isBehind}
      options={options}
      onCommand={handleCommand}
      onUserScroll={moveToAnchor}
      isHelpOpen={isHelpOpen}
      onToggleHelp={onToggleHelp}
    />
  );
}

const noEvents: TeleprompterScript['events'] = [];

const waitingMessages = {
  'nothing-loaded': 'Waiting for an event to load. The script of the loaded event shows here',
  'no-script': 'The loaded event has no script',
};

interface ScriptContentProps {
  script: TeleprompterScript | undefined;
  status: 'pending' | 'error' | 'success';
  /** what the view shows */
  state: TeleprompterState;
  /** where the view reads from, in rows of the script */
  sync: TeleprompterSync;
  /** the sync refers to a script the view has not received yet */
  isBehind: boolean;
  options: TeleprompterOptions;
  onCommand?: (command: TeleprompterViewCommand) => void;
  onUserScroll?: (anchor: TeleprompterAnchor) => void;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

function ScriptContent({
  script,
  status,
  state,
  sync,
  isBehind,
  options,
  onCommand,
  onUserScroll,
  isHelpOpen,
  onToggleHelp,
}: ScriptContentProps) {
  const loadedEventId: EntryId | null = useSelectedEventId();
  const scriptLayout = useMemo(() => makeTeleprompterLayout(script?.events ?? noEvents), [script]);
  // a new array of events would lay out the rows and size the text again, so it changes only with what it shows
  const shown = useMemo(() => {
    if (!script) return null;
    return options.onlyLoaded ? filterToLoadedEvent(script.events, loadedEventId) : { events: script.events };
  }, [script, loadedEventId, options.onlyLoaded]);

  if (!script || !shown) {
    if (status === 'error') {
      return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
    }
    return <Loader />;
  }

  const loadedEvent = getLoadedEvent(script, loadedEventId);
  const controls = (
    <ControlOverlay
      role={options.role}
      state={state}
      loadedEvent={loadedEvent}
      onCommand={onCommand}
      onToggleHelp={onToggleHelp}
    />
  );

  if ('waiting' in shown) {
    return (
      <>
        <EmptyPage text={waitingMessages[shown.waiting]} />
        {controls}
      </>
    );
  }
  if (shown.events.length === 0) return <EmptyPage text='There is no script in the field the teleprompter reads' />;

  return (
    <TeleprompterScreen
      events={shown.events}
      charsPerLine={script.charsPerLine}
      sync={sync}
      scriptLayout={scriptLayout}
      isBehind={isBehind}
      ended={state.ended}
      options={options}
      loadedEventId={loadedEventId}
      fallbackRow={options.onlyLoaded ? shown.events[0]?.lines.findIndex((line) => line.kind === 'text') : undefined}
      onCommand={onCommand}
      onUserScroll={onUserScroll}
      inputDisabled={isHelpOpen}
    >
      {controls}
    </TeleprompterScreen>
  );
}

function getLoadedEvent(script: TeleprompterScript, loadedEventId: EntryId | null): LoadedEvent | null {
  if (!loadedEventId) return null;
  const event = script.events.find((candidate) => candidate.id === loadedEventId);
  if (!event) return { id: loadedEventId, cue: '', title: '', inScript: false };
  return { id: event.id, cue: event.cue, title: event.title, inScript: true };
}

/**
 * Keys every teleprompter view answers to, whatever its role
 * - ? opens the shortcut list
 * - Space never presses a focused button or opens a menu: on a controller or a local view it only plays and pauses
 */
function useViewKeys(onToggleHelp: () => void) {
  const handler = useRef(onToggleHelp);
  // keeps the latest handler for the listener, which is registered once
  useEffect(() => {
    handler.current = onToggleHelp;
  });

  // runs before any focused element, so Space cannot reach a button or a menu shortcut
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || useViewParamsEditorStore.getState().isOpen) return;
      if (event.code === 'Space') {
        event.preventDefault();
        return;
      }
      if (event.type === 'keydown' && event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handler.current();
      }
    }

    window.addEventListener('keydown', handleKey, { capture: true });
    window.addEventListener('keyup', handleKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true });
      window.removeEventListener('keyup', handleKey, { capture: true });
    };
  }, []);
}
