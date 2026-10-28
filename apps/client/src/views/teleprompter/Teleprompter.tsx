import {
  type EntryId,
  OntimeView,
  type TeleprompterAnchor,
  type TeleprompterScript,
  type TeleprompterState,
  type TeleprompterSync,
} from 'ontime-types';
import { makeTeleprompterLayout, type TeleprompterLayout } from 'ontime-utils';
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';

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
import { getScriptSourceLabel } from '../../common/utils/teleprompterScriptSource';
import Loader from '../common/loader/Loader';
import ControlOverlay, { type LoadedEvent } from './control-overlay/ControlOverlay';
import HelpOverlay from './help-overlay/HelpOverlay';
import TransportShortcuts from './help-overlay/TransportShortcuts';
import type { TeleprompterViewCommand } from './teleprompter.keymap';
import {
  getTeleprompterOptions,
  projectSource,
  type TeleprompterOptions,
  type TeleprompterRole,
  useTeleprompterOptions,
} from './teleprompter.options';
import { composeFlip, filterToLoadedEvent, toTeleprompterPayload } from './teleprompter.utils';
import TeleprompterScreen from './TeleprompterScreen';
import { useLocalTransport } from './useLocalTransport';
import { isDialogOpen, isTypingTarget, useTeleprompterInput } from './useTeleprompterInput';

import './Teleprompter.scss';

const helpNotes: Record<TeleprompterRole, string> = {
  remote: 'Following shared playback. Use a controller screen or Companion to move the script.',
  controller: 'Controls shared playback for all following screens.',
  local: 'Playback stays in this view.',
};

export default function Teleprompter() {
  const options = useTeleprompterOptions();
  const isMirrored = useViewOptionsStore((state) => state.mirror);
  const { data: settings } = useTeleprompterSettings();
  const { data: customFields } = useCustomFields();
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = () => setShowHelp((current) => !current);

  useWindowTitle('Teleprompter');
  useViewKeys(toggleHelp);

  const { role } = options;
  const flip = composeFlip(options.flipH, options.flipV, isMirrored);
  // only a view playing on its own reads a field of its own, so the shared playback shows the same lines everywhere
  const ownSource = role === 'local' && options.source !== projectSource ? options.source : undefined;
  const sourceLabel = getScriptSourceLabel(ownSource ?? settings.script, customFields);
  const emptyText = ownSource
    ? `There is no script in ${sourceLabel}. Choose another field in Customise`
    : `There is no script in ${sourceLabel}. Change it in Settings\u00a0›\u00a0Teleprompter`;

  return (
    <div
      className={cx(['teleprompter', flip.flipH && 'teleprompter--flip-h', flip.flipV && 'teleprompter--flip-v'])}
      data-testid='teleprompter-view'
    >
      <ViewParamsEditor target={OntimeView.Teleprompter} viewOptions={getTeleprompterOptions(customFields, settings)} />
      {role === 'local' ? (
        <LocalTeleprompter options={options} source={ownSource} emptyText={emptyText} onToggleHelp={toggleHelp} />
      ) : (
        <SharedTeleprompter options={options} emptyText={emptyText} onToggleHelp={toggleHelp} />
      )}
      {role === 'controller' && (
        <div className='teleprompter__badge' data-testid='teleprompter-badge'>
          Controller · shared playback
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
  /** what the view says when the field it reads holds no script */
  emptyText: string;
  onToggleHelp: () => void;
}

const sendCommand = (command: TeleprompterViewCommand) => sendSocket('teleprompter', toTeleprompterPayload(command));

/**
 * Shows the transport the server holds, which Companion and the integration API drive
 * It shows what the server publishes, and reads from the position the server calculates, in rows of the script
 * A controller also sends commands, which reach every following view
 */
function SharedTeleprompter({ options, emptyText, onToggleHelp }: TeleprompterViewProps) {
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
      emptyText={emptyText}
      onCommand={isController ? sendCommand : undefined}
      onToggleHelp={onToggleHelp}
    />
  );
}

/**
 * Runs the same transport in the browser, over the same script or one read from another field
 * @param source - the field to read instead of the project's
 */
function LocalTeleprompter({
  options,
  source,
  emptyText,
  onToggleHelp,
}: TeleprompterViewProps & { source: string | undefined }) {
  const { data: script, status } = useTeleprompterScript(source);
  const loadedEventId = useSelectedEventId();
  const { sync, isBehind, state, layout, handleCommand, moveToAnchor } = useLocalTransport({
    events: script?.events ?? noEvents,
    initialMode: options.mode,
    initialSpeed: options.speed,
    loadedEventId,
  });

  return (
    <ScriptContent
      script={script}
      scriptLayout={layout}
      status={status}
      state={state}
      sync={sync}
      isBehind={isBehind}
      options={options}
      emptyText={emptyText}
      onCommand={handleCommand}
      onUserScroll={moveToAnchor}
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
  /** A local transport already owns the layout of its script. */
  scriptLayout?: TeleprompterLayout;
  status: 'pending' | 'error' | 'success';
  /** what the view shows */
  state: TeleprompterState;
  /** where the view reads from, in rows of the script */
  sync: TeleprompterSync;
  /** the sync refers to a script the view has not received yet */
  isBehind: boolean;
  options: TeleprompterOptions;
  emptyText: string;
  onCommand?: (command: TeleprompterViewCommand) => void;
  onUserScroll?: (anchor: TeleprompterAnchor) => void;
  onToggleHelp: () => void;
}

function ScriptContent({
  script,
  scriptLayout: providedLayout,
  status,
  state,
  sync,
  isBehind,
  options,
  emptyText,
  onCommand,
  onUserScroll,
  onToggleHelp,
}: ScriptContentProps) {
  const loadedEventId: EntryId | null = useSelectedEventId();
  const scriptLayout = useMemo(
    () => providedLayout ?? makeTeleprompterLayout(script?.events ?? noEvents),
    [providedLayout, script],
  );
  // a new array of events would lay out the rows and size the text again, so it changes only with what it shows
  const shown = useMemo(() => {
    if (!script) return null;
    // a field with no script says so before what the loaded event holds
    if (!options.onlyLoaded || script.events.length === 0) return { events: script.events };
    return filterToLoadedEvent(script.events, loadedEventId);
  }, [script, loadedEventId, options.onlyLoaded]);

  if (!script || !shown) {
    if (status === 'error') {
      return <EmptyPage variant='error' text='There was an error fetching data, please refresh the page.' />;
    }
    return <Loader />;
  }

  const controls = onCommand ? (
    <ControlOverlay
      state={state}
      loadedEvent={getLoadedEvent(script, loadedEventId)}
      onCommand={onCommand}
      onToggleHelp={onToggleHelp}
    />
  ) : null;

  if ('waiting' in shown) {
    return (
      <WaitingScript text={waitingMessages[shown.waiting]} onCommand={onCommand}>
        {controls}
      </WaitingScript>
    );
  }
  if (shown.events.length === 0) return <EmptyPage text={emptyText} />;

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
    >
      {controls}
    </TeleprompterScreen>
  );
}

/** Waiting views still control playback, even though there are no rows to show or measure. */
function WaitingScript({
  text,
  onCommand,
  children,
}: PropsWithChildren<{ text: string; onCommand: ScriptContentProps['onCommand'] }>) {
  useTeleprompterInput({ screen: null, onCommand, rowHeight: 0, wheel: false });

  return (
    <>
      <EmptyPage text={text} />
      {children}
    </>
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
 * - outside a dialog, Space never presses a focused button or opens a menu: on a controller or a local view it only plays and pauses
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
        // a menu or dialog keeps Space for its own buttons
        if (!isDialogOpen()) event.preventDefault();
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
