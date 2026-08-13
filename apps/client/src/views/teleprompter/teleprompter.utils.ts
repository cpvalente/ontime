import { type CustomFields, isOntimeEvent, isOntimeGroup, type MaybeString, type Rundown } from 'ontime-types';

import type { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { getPropertyValue } from '../common/viewUtils';
import type { HeadingSource, ScriptBlock, TeleprompterOptions } from './teleprompter.types';

type BuildScriptOptions = Pick<TeleprompterOptions, 'scriptSource' | 'heading' | 'hideEmpty' | 'showGroups'>;

function makeHeading(source: HeadingSource, cue: string, title: string): string {
  switch (source) {
    case 'cue':
      return cue;
    case 'title':
      return title;
    case 'both':
      return [cue, title].filter(Boolean).join(' · ');
    case 'none':
      return '';
  }
}

function isReadableSource(scriptSource: string, customFields: CustomFields): boolean {
  if (!scriptSource.startsWith('custom-')) {
    return true;
  }
  const key = scriptSource.slice('custom-'.length);
  return customFields[key]?.type === 'text';
}

/** Builds the continuous script in rundown order. */
export function buildScript(
  rundown: Rundown,
  rundownMetadata: RundownMetadataObject,
  customFields: CustomFields,
  options: BuildScriptOptions,
): ScriptBlock[] {
  const { scriptSource, heading, hideEmpty, showGroups } = options;

  if (scriptSource === 'none' || !isReadableSource(scriptSource, customFields)) {
    return [];
  }

  const blocks: ScriptBlock[] = [];
  let lastGroupId: MaybeString = null;

  for (const id of rundown.flatOrder) {
    const entry = rundown.entries[id];
    if (!isOntimeEvent(entry) || entry.skip) {
      continue;
    }

    const metadata = rundownMetadata[id];
    const text = getPropertyValue(entry, scriptSource, rundown.entries)?.trim() ?? '';
    if (hideEmpty && !text) {
      continue;
    }

    const groupId = metadata?.groupId ?? null;
    let groupTitle: MaybeString = null;
    if (showGroups && groupId && groupId !== lastGroupId) {
      const group = rundown.entries[groupId];
      groupTitle = isOntimeGroup(group) ? group.title : null;
    }
    lastGroupId = groupId;

    blocks.push({
      id,
      heading: makeHeading(heading, entry.cue, entry.title),
      text,
      groupTitle,
      isLoaded: Boolean(metadata?.isLoaded),
    });
  }

  return blocks;
}

export function composeFlip(flipH: boolean, flipV: boolean, isMirrored: boolean): { flipH: boolean; flipV: boolean } {
  return { flipH: flipH !== isMirrored, flipV: flipV !== isMirrored };
}
