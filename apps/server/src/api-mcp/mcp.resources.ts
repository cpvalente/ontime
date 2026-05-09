import { getProjectData } from '../api-data/project-data/projectData.dao.js';
import { getCurrentRundown, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';
import type { ListResourcesResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

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
    uri: 'ontime://docs',
    name: 'ontime-docs',
    title: 'Ontime documentation index',
    description:
      'Curated index of Ontime documentation topics with direct links to https://docs.getontime.no. Read this when you need to understand a concept in more depth or want to point the user to official documentation.',
    mimeType: 'text/markdown',
  },
];

export function handleReadResource(uri: string): ReadResourceResult {
  if (uri === 'ontime://schema') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ONTIME_SCHEMA_MARKDOWN }] };
  }

  if (uri === 'ontime://rundown/current') {
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getCurrentRundown()) }],
    };
  }

  if (uri === 'ontime://rundowns') {
    const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
    const loaded = getCurrentRundown().id;
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ loaded, rundowns }) }],
    };
  }

  if (uri === 'ontime://project/info') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectData()) }] };
  }

  if (uri === 'ontime://project/custom-fields') {
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getProjectCustomFields()) }],
    };
  }

  if (uri === 'ontime://docs') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ONTIME_DOCS_MARKDOWN }] };
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}
