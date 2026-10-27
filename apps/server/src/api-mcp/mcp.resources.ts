import type { ListResourcesResult, ReadResourceResult } from '@modelcontextprotocol/server';

import { readCssFile } from '../api-data/assets/assets.service.js';
import { customViewMaxFileSize } from '../api-data/custom-views/customViews.service.js';
import { getProjectData } from '../api-data/project-data/projectData.dao.js';
import { getCurrentRundown, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getViewSettings } from '../api-data/view-settings/viewSettings.dao.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import {
  ONTIME_STYLE_GUIDE_MARKDOWN,
  ONTIME_VIEWS_MARKDOWN,
  makeCustomViewTemplateMarkdown,
  makeViewsCustomiseMarkdown,
} from './mcp.guides.js';
import { ONTIME_DOCS_MARKDOWN, ONTIME_SCHEMA_MARKDOWN } from './mcp.schema.js';

export const RESOURCE_DEFINITIONS: ListResourcesResult['resources'] = [
  {
    uri: 'ontime://schema',
    name: 'ontime-schema',
    title: 'Ontime data model reference',
    description:
      'Markdown reference for rundown structure, event fields, time format, and entry types. Read once per session to ground tool calls in the correct data model.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://rundown/current',
    name: 'current-rundown',
    title: 'Currently loaded rundown',
    description:
      'The rundown currently active in Ontime, with its full entries map and order. Re-read after any mutating call to see updated state.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://rundowns',
    name: 'project-rundowns',
    title: 'All rundowns in the project',
    description: 'List of every rundown stored in the current project file, plus the ID of the one currently loaded.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://project/info',
    name: 'project-info',
    title: 'Project metadata',
    description: 'Project title, description, URL, info, logo, and custom header fields.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://project/custom-fields',
    name: 'project-custom-fields',
    title: 'Custom field definitions',
    description:
      'Map of custom field keys to their label, type, and colour. Events reference these keys in their `custom` object.',
    mimeType: 'application/json',
  },
  {
    uri: 'ontime://style-guide',
    name: 'ontime-style-guide',
    title: 'Rundown style guide',
    description:
      'Best practices for tidy, easy-to-read rundowns: grouping, colour conventions and the default Ontime palette, cue naming, custom fields vs notes, timing hygiene. Read before creating or restyling a rundown.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://views',
    name: 'ontime-views',
    title: 'Views and sharing guide',
    description:
      'What each Ontime view (timer, backstage, operator, cuesheet, timeline, countdown, studio clock, project info) is for, key URL parameters, URL presets, and custom views. Read when recommending how a team member should follow or edit the show.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://views/customise',
    name: 'ontime-views-customise',
    title: 'View customisation guide',
    description:
      'How to change the look of the screens: per-screen URL options, CSS for a view or every screen, or a custom view. Includes the example CSS and the current CSS override and whether it is on. Read before styling views.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://views/custom-view-template',
    name: 'ontime-custom-view-template',
    title: 'Custom view template',
    description:
      'A starting index.html for a custom view that reads live data from Ontime, with the upload rules. Read before writing a custom view.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'ontime://docs',
    name: 'ontime-docs',
    title: 'Ontime documentation index',
    description:
      'Curated index of Ontime documentation topics with direct links to https://docs.getontime.no. Read this when you need to understand a concept in more depth or want to point the user to official documentation.',
    mimeType: 'text/markdown',
  },
];

const RESOURCE_READERS: Record<string, { mimeType: string; read: () => string | Promise<string> }> = {
  'ontime://schema': { mimeType: 'text/markdown', read: () => ONTIME_SCHEMA_MARKDOWN },
  'ontime://style-guide': { mimeType: 'text/markdown', read: () => ONTIME_STYLE_GUIDE_MARKDOWN },
  'ontime://views': { mimeType: 'text/markdown', read: () => ONTIME_VIEWS_MARKDOWN },
  'ontime://views/customise': {
    mimeType: 'text/markdown',
    read: async () => {
      // the guidance stays useful without the user's CSS, so a read failure does not fail the resource
      const userCss = await readCssFile().catch(() => '/* the current CSS override could not be read */');
      return makeViewsCustomiseMarkdown(userCss, getViewSettings().overrideStyles);
    },
  },
  'ontime://views/custom-view-template': {
    mimeType: 'text/markdown',
    read: () => makeCustomViewTemplateMarkdown(customViewMaxFileSize / 1_000_000),
  },
  'ontime://docs': { mimeType: 'text/markdown', read: () => ONTIME_DOCS_MARKDOWN },
  'ontime://rundown/current': {
    mimeType: 'application/json',
    read: () => JSON.stringify(getCurrentRundown()),
  },
  'ontime://rundowns': {
    mimeType: 'application/json',
    read: () => {
      const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
      const loaded = getCurrentRundown().id;
      return JSON.stringify({ loaded, rundowns });
    },
  },
  'ontime://project/info': {
    mimeType: 'application/json',
    read: () => JSON.stringify(getProjectData()),
  },
  'ontime://project/custom-fields': {
    mimeType: 'application/json',
    read: () => JSON.stringify(getProjectCustomFields()),
  },
};

export async function handleReadResource(uri: string): Promise<ReadResourceResult> {
  const reader = RESOURCE_READERS[uri];
  if (!reader) throw new Error(`Unknown resource URI: ${uri}`);
  return { contents: [{ uri, mimeType: reader.mimeType, text: await reader.read() }] };
}
