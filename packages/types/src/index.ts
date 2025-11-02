// DATA MODEL
export type { DatabaseModel } from './definitions/DataModel.type.js';

// ---> Rundown
export { EndAction } from './definitions/EndAction.type.js';
export {
  type EntryId,
  type OntimeBaseEvent,
  type OntimeDelay,
  type OntimeGroup,
  type OntimeEntryCommonKeys,
  type OntimeEntry,
  type OntimeMilestone,
  type OntimeEvent,
  type PlayableEvent,
  type TimeField,
  SupportedEntry,
} from './definitions/core/OntimeEntry.js';
export type { RundownEntries, Rundown, ProjectRundowns } from './definitions/core/Rundown.type.js';
export { TimeStrategy } from './definitions/TimeStrategy.type.js';
export { TimerType } from './definitions/TimerType.type.js';

// ---> Report
export type { OntimeReport, OntimeEventReport } from './definitions/core/Report.type.js';

// ---> Automations
export { ontimeActionKeyValues } from './definitions/core/Automation.type.js';
export type {
  OntimeActionKey,
  Automation,
  AutomationDTO,
  AutomationFilter,
  AutomationSettings,
  AutomationOutput,
  FilterRule,
  HTTPOutput,
  NormalisedAutomation,
  OntimeAction,
  OSCOutput,
  Trigger,
  TriggerDTO,
} from './definitions/core/Automation.type.js';

// ---> Project Data
export type { ProjectData } from './definitions/core/ProjectData.type.js';

// ---> Settings
export type { Settings } from './definitions/core/Settings.type.js';

// ---> Views
export type { ViewSettings } from './definitions/core/Views.type.js';
export type { TimeFormat } from './definitions/core/TimeFormat.type.js';

// ---> URL Presets
export { OntimeView, type URLPreset, type OntimeViewPresettable } from './definitions/core/UrlPreset.type.js';

// ---> Custom Fields
export type {
  CustomFields,
  CustomField,
  CustomFieldKey,
  EntryCustomFields,
} from './definitions/core/CustomFields.type.js';

// SERVER RESPONSES
export type { QuickStartData } from './api/db/db.type.js';
export type {
  AuthenticationStatus,
  NetworkInterface,
  GetInfo,
  GetUrl,
  ProjectFileList,
  ProjectFile,
  ErrorResponse,
  ProjectFileListResponse,
  MessageResponse,
  SessionStats,
  ProjectLogoResponse,
} from './api/ontime-controller/BackendResponse.type.js';
export type {
  EventPostPayload,
  PatchWithId,
  ProjectRundown,
  ProjectRundownsList,
  TransientEventPayload,
  RundownSummary,
} from './api/rundown-controller/BackendResponse.type.js';
export type { LinkOptions } from './api/session-controller/BackendResponse.type.js';

// web socket
export { MessageTag } from './api/websocket/data.type.js';
export type { WsPacketToServer, WsPacketToClient } from './api/websocket/data.type.js';
export { RefetchKey } from './api/websocket/refetch.type.js';
export type { ApiAction, ApiActionTag, ApiResponse } from './api/websocket/api.type.js';
// SERVER RUNTIME
export { type Log, LogLevel, type LogMessage, LogOrigin } from './definitions/runtime/Logger.type.js';
export { Playback } from './definitions/runtime/Playback.type.js';
export { TimerLifeCycle, timerLifecycleValues } from './definitions/core/TimerLifecycle.type.js';
export type { TimerMessage, MessageState, SecondarySource } from './definitions/runtime/MessageControl.type.js';

export type { RundownState } from './definitions/runtime/RundownState.type.js';
export type { Offset } from './definitions/runtime/Offset.type.js';
export { OffsetMode } from './definitions/runtime/Offset.type.js';
export type { RuntimeStore } from './definitions/runtime/RuntimeStore.type.js';
export { runtimeStorePlaceholder } from './definitions/runtime/RuntimeStore.js';
export { type TimerState, TimerPhase } from './definitions/runtime/TimerState.type.js';

// ---> Extra Timer
export { type SimpleTimerState, SimplePlayback, SimpleDirection } from './definitions/runtime/AuxTimer.type.js';

// CLIENT
export type { Client, ClientList, ClientType } from './definitions/Clients.type.js';

// TYPE UTILITIES
export {
  isOntimeGroup,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeMilestone,
  isPlayableEvent,
  isKeyOfType,
  isOSCOutput,
  isHTTPOutput,
  isOntimeAction,
  isTimerLifeCycle,
} from './utils/guards.js';
export type { MaybeNumber, MaybeString } from './utils/utils.type.js';

// Colour
export type { RGBColour } from './definitions/Colour.type.js';

// Translations
export { langEn, type TranslationObject } from './translations/index.js';
