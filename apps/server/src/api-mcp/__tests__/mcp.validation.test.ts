import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { TOOLS } from '../mcp.tools.js';

const PROJECTS_DIR = resolve('/projects');

function schemaFor(name: string) {
  const tool = TOOLS.find((candidate) => candidate.name === name);
  if (!tool?.config.inputSchema) {
    throw new Error(`No input schema for ${name}`);
  }
  return tool.config.inputSchema;
}

/** Parses and returns the sanitised arguments, failing the test on invalid input */
function parse(name: string, args: Record<string, unknown>): Record<string, unknown> {
  const result = schemaFor(name).safeParse(args);
  if (!result.success) {
    throw new Error(`Expected ${name} to accept the arguments: ${issuesOf(result.error)}`);
  }
  return result.data;
}

function issuesOf(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

/** Returns the issue messages of arguments which must not be accepted */
function reject(name: string, args: Record<string, unknown>): string {
  const result = schemaFor(name).safeParse(args);
  if (result.success) {
    throw new Error(`Expected ${name} to reject ${JSON.stringify(args)}`);
  }
  return issuesOf(result.error);
}

describe('required arguments', () => {
  it('rejects an update without an entry id', () => {
    expect(reject('ontime_update_entry', { title: 'Keynote' })).toContain('id');
  });

  it('rejects a reorder without a destination', () => {
    expect(reject('ontime_reorder_entry', { entryId: 'entry-1', order: 'after' })).toContain('destinationId');
  });

  it('accepts a well formed update', () => {
    expect(parse('ontime_update_entry', { id: 'entry-1', title: 'Keynote', timeStart: 32400000 })).toEqual({
      id: 'entry-1',
      title: 'Keynote',
      timeStart: 32400000,
    });
  });
});

describe('argument types', () => {
  it('rejects a stringified number where a time is expected', () => {
    expect(reject('ontime_update_entry', { id: 'entry-1', timeStart: '09:00' })).toContain('timeStart');
  });

  it('rejects a non-array list of ids', () => {
    expect(reject('ontime_delete_entries', { ids: 'entry-1' })).toContain('ids');
  });

  it('rejects an empty list of ids to group', () => {
    expect(reject('ontime_group_entries', { ids: [] })).toContain('Provide at least one entry ID to group.');
  });

  it('rejects an unknown reorder position', () => {
    expect(reject('ontime_reorder_entry', { entryId: 'a', destinationId: 'b', order: 'sideways' })).toContain('order');
  });

  it('rejects an unknown entry type', () => {
    expect(reject('ontime_create_entry', { type: 'interlude' })).toContain('type');
  });

  it('rejects non-string custom field values', () => {
    expect(reject('ontime_update_entry', { id: 'entry-1', custom: { Camera: 2 } })).toContain('custom.Camera');
  });

  it('accepts an insert anchor as an id or as true, but not as false', () => {
    expect(parse('ontime_create_entry', { after: 'entry-1' })).toEqual({ after: 'entry-1' });
    expect(parse('ontime_create_entry', { before: true })).toEqual({ before: true });
    // `after: false` has no meaning: the services only check whether the anchor is present
    expect(reject('ontime_create_entry', { after: false })).toContain('after');
  });
});

describe('unknown keys', () => {
  it('rejects fields which are not part of the tool', () => {
    expect(reject('ontime_update_entry', { id: 'entry-1', titel: 'typo' })).toContain('titel');
  });

  /**
   * editCurrentProjectData spreads its argument into the stored project, and reacts to a
   * `logo` key by deleting the current logo file. Only declared fields may reach it.
   */
  it('rejects undeclared writes to project data', () => {
    expect(reject('ontime_update_project_info', { title: 'Show', logo: 'other.png' })).toContain('logo');
    expect(parse('ontime_update_project_info', { title: 'Show' })).toEqual({ title: 'Show' });
  });

  it('rejects entry internals which the services must own', () => {
    expect(reject('ontime_update_entry', { id: 'entry-1', revision: 99 })).toContain('revision');
    expect(reject('ontime_update_entry', { id: 'entry-1', parent: 'group-1' })).toContain('parent');
  });
});

describe('project filenames', () => {
  /**
   * Filenames reach the filesystem through join(projectsDir, name), so the invariant that
   * matters is that nothing which could traverse out of that directory survives parsing.
   */
  const directoryOf = (filename: unknown) => dirname(resolve(PROJECTS_DIR, String(filename)));

  it.each(['../../../etc/passwd', '../sibling.json', '..\\windows\\system32\\show.json', '/etc/shadow', 'show.json'])(
    'confines %s to the projects directory',
    (filename) => {
      expect(directoryOf(parse('ontime_delete_project', { filename }).filename)).toBe(PROJECTS_DIR);
      expect(directoryOf(parse('ontime_load_project', { filename }).filename)).toBe(PROJECTS_DIR);
    },
  );

  it('confines both filenames of a rename', () => {
    const args = parse('ontime_rename_project', { filename: '../a.json', newFilename: '../../b.json' });
    expect(directoryOf(args.filename)).toBe(PROJECTS_DIR);
    expect(directoryOf(args.newFilename)).toBe(PROJECTS_DIR);
  });

  it('appends the extension and trims the name', () => {
    expect(parse('ontime_delete_project', { filename: '  show  ' })).toEqual({ filename: 'show.json' });
    expect(parse('ontime_delete_project', { filename: 'show.json' })).toEqual({ filename: 'show.json' });
  });

  it('rejects a filename which is empty once sanitised', () => {
    expect(reject('ontime_delete_project', { filename: '..' })).toContain('sanitised');
    expect(reject('ontime_delete_project', { filename: '   ' })).toBeTruthy();
  });

  it('does not append an extension when creating a project', () => {
    // ProjectService appends the extension itself, and de-duplicates the name
    expect(parse('ontime_create_project', { filename: '  my-show  ' })).toEqual({ filename: 'my-show' });
    expect(directoryOf(parse('ontime_create_project', { filename: '../my-show' }).filename)).toBe(PROJECTS_DIR);
  });
});

describe('batch creation', () => {
  const entry = { type: 'event', title: 'Talk', duration: 600000 };

  it('accepts a group with children', () => {
    const args = parse('ontime_batch_create_entries', {
      entries: [{ type: 'group', title: 'Morning', children: [entry] }],
    });
    expect(args.entries).toHaveLength(1);
  });

  it('rejects a group nested inside a group', () => {
    const issues = reject('ontime_batch_create_entries', {
      entries: [{ type: 'group', title: 'Morning', children: [{ type: 'group', title: 'Nested' }] }],
    });
    expect(issues).toContain('type');
  });

  it('rejects children on entries which are not groups', () => {
    expect(
      reject('ontime_batch_create_entries', { entries: [{ type: 'event', title: 'Talk', children: [entry] }] }),
    ).toContain('Only group entries can have children.');
  });

  it('rejects unknown keys inside nested children', () => {
    expect(
      reject('ontime_batch_create_entries', {
        entries: [{ type: 'group', title: 'Morning', children: [{ ...entry, titel: 'typo' }] }],
      }),
    ).toContain('titel');
  });
});

describe('lookups which need one of several arguments', () => {
  it('requires an id or a cue', () => {
    expect(reject('ontime_get_entry', {})).toContain('Provide id or cue');
    expect(parse('ontime_get_entry', { cue: '1a' })).toEqual({ cue: '1a' });
  });
});
