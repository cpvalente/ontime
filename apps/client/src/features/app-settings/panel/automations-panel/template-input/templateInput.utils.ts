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
  '{{timer.finishedAt}}',
  '{{timer.secondaryTimer}}',
  '{{timer.startedAt}}',
  '{{runtime.selectedEventIndex}}',
  '{{runtime.numEvents}}',
  '{{runtime.offset}}',
  '{{runtime.plannedStart}}',
  '{{runtime.plannedEnd}}',
  '{{runtime.actualStart}}',
  '{{runtime.expectedEnd}}',
  '{{currentBlock.block}}',
  '{{currentBlock.startedAt}}',
];

const eventStaticPropertiesNow = [
  '{{eventNow.id}}',
  '{{eventNow.cue}}',
  '{{eventNow.title}}',
  '{{eventNow.note}}',
  '{{eventNow.timeStart}}',
  '{{eventNow.timeEnd}}',
  '{{eventNow.duration}}',
  '{{eventNow.isPublic}}',
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
  '{{eventNext.isPublic}}',
  '{{eventNext.colour}}',
  '{{eventNext.delay}}',
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
  ];
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

/**
 * Selects the last starting template in a string
 */
export function selectFromLastTemplate(text: string) {
  const lastBraceIndex = text.lastIndexOf('{{');
  if (lastBraceIndex !== -1) {
    return text.slice(lastBraceIndex);
  }
  return '';
}
