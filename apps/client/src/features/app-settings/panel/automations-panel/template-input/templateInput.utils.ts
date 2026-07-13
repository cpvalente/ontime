import { CustomFields } from 'ontime-types';

const humanConstants = [
  '{{human.clock}}',
  '{{human.duration}}',
  '{{human.expectedEnd}}',
  '{{human.runningTimer}}',
  '{{human.elapsedTime}}',
  '{{human.startedAt}}',
];

const staticAutocompleteOptions = [
  '{{clock}}',
  '{{timer.addedTime}}',
  '{{timer.current}}',
  '{{timer.duration}}',
  '{{timer.elapsed}}',
  '{{timer.expectedFinish}}',
  '{{timer.secondaryTimer}}',
  '{{timer.startedAt}}',
  '{{rundown.selectedEventIndex}}',
  '{{rundown.numEvents}}',
  '{{rundown.plannedStart}}',
  '{{rundown.plannedEnd}}',
  '{{rundown.actualStart}}',
  '{{offset.absolute}}',
  '{{offset.relative}}',
  '{{offset.expectedRundownEnd}}',
  '{{offset.expectedGroupEnd}}',
  '{{offset.expectedFlagStart}}',
];

const eventStaticPropertiesNow = [
  '{{eventNow.id}}',
  '{{eventNow.cue}}',
  '{{eventNow.title}}',
  '{{eventNow.note}}',
  '{{eventNow.timeStart}}',
  '{{eventNow.timeEnd}}',
  '{{eventNow.duration}}',
  '{{eventNow.colour}}',
  '{{eventNow.delay}}',
];

const eventStaticPropertiesNext = [
  '{{eventNext.id}}',
  '{{eventNext.cue}}',
  '{{eventNext.title}}',
  '{{eventNext.note}}',
  '{{eventNext.timeStart}}',
  '{{eventNext.timeEnd}}',
  '{{eventNext.duration}}',
  '{{eventNext.colour}}',
  '{{eventNext.delay}}',
];

const groupStaticPropertiesNow = [
  '{{groupNow.id}}',
  '{{groupNow.title}}',
  '{{groupNow.note}}',
  '{{groupNow.colour}}',
  '{{groupNow.timeStart}}',
  '{{groupNow.timeEnd}}',
  '{{groupNow.duration}}',
];

const staticAuxProperties = (index: 1 | 2 | 3) => [
  `{{auxtimer${index}.current}}`,
  `{{auxtimer${index}.duration}}`,
  `{{auxtimer${index}.playback}}`,
  `{{auxtimer${index}.direction}}`,
];

/**
 * Creates a it of possible autocomplete suggestions
 * Based on RuntimeState
 * Appends the human readable variants to it
 * It is manually kept in sync with the automation parseTemplate functions
 */
export function makeAutoCompleteList(customFields: CustomFields): string[] {
  return [
    ...humanConstants,
    ...staticAutocompleteOptions,
    ...eventStaticPropertiesNow,
    ...Object.entries(customFields).map(([key]) => `{{eventNow.custom.${key}}}`),
    ...eventStaticPropertiesNext,
    ...Object.entries(customFields).map(([key]) => `{{eventNext.custom.${key}}}`),
    ...groupStaticPropertiesNow,
    ...Object.entries(customFields).map(([key]) => `{{groupNow.custom.${key}}}`),
    ...staticAuxProperties(1),
    ...staticAuxProperties(2),
    ...staticAuxProperties(3),
  ];
}

interface TemplateCompletion {
  cursorIndex: number;
  value: string;
}

/**
 * Returns the partial string b needed to autocomplete string a
 * @example matchRemaining('te', 'test') -> 'st'
 * @example matchRemaining('{{', '{{human}}') -> 'man}}'
 */
export function matchRemaining(a: string, b: string) {
  if (a === b) {
    return '';
  }

  // naive match assuming that a template will start with {{
  if (a.endsWith('{{') && b.startsWith('{{')) {
    return b.substring(2);
  }

  // naive match assuming that a template will start with {
  if (a.endsWith('{') && b.startsWith('{{')) {
    return b.substring(1);
  }

  for (let i = 0; i < b.length; i++) {
    const searchString = b.substring(0, i + 1);
    if (a.endsWith(searchString)) {
      return b.substring(i + 1);
    }
  }

  return '';
}

function getActiveTemplateRange(text: string, cursorIndex = text.length) {
  const textBeforeCursor = text.slice(0, cursorIndex);
  const start = textBeforeCursor.lastIndexOf('{{');
  if (start === -1) {
    return null;
  }

  const closeBeforeCursor = textBeforeCursor.lastIndexOf('}}');
  if (closeBeforeCursor > start) {
    return null;
  }

  const closeAfterStart = text.indexOf('}}', start);
  const nextStartAfterCursor = text.indexOf('{{', cursorIndex);
  const closesBeforeNextTemplate = nextStartAfterCursor === -1 || closeAfterStart < nextStartAfterCursor;
  const end = closeAfterStart !== -1 && closesBeforeNextTemplate ? closeAfterStart + 2 : cursorIndex;

  return {
    end,
    start,
    template: text.slice(start, cursorIndex),
  };
}

/**
 * Selects the last unclosed starting template before the cursor.
 */
export function selectActiveTemplate(text: string, cursorIndex = text.length) {
  return getActiveTemplateRange(text, cursorIndex)?.template ?? '';
}

/**
 * Replaces the active template fragment before the cursor with the selected suggestion.
 */
export function completeTemplateAtCursor(
  text: string,
  suggestion: string,
  cursorIndex = text.length,
): TemplateCompletion {
  const activeTemplateRange = getActiveTemplateRange(text, cursorIndex);
  if (!activeTemplateRange) {
    const value = text + matchRemaining(text, suggestion);
    return { value, cursorIndex: value.length };
  }

  const value = `${text.slice(0, activeTemplateRange.start)}${suggestion}${text.slice(activeTemplateRange.end)}`;
  return {
    value,
    cursorIndex: activeTemplateRange.start + suggestion.length,
  };
}
