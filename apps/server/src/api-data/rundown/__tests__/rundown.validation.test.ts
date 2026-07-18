import type { OntimeGroup } from 'ontime-types';
import { describe, expect, test } from 'vitest';

import { makeOntimeEvent, makeOntimeGroup, makeRundown } from '../__mocks__/rundown.mocks.js';
import { assertInsertAnchorExists, assertInsertAnchorInOrder } from '../rundown.validation.js';

const rundown = makeRundown({
  order: ['top', 'group'],
  entries: {
    top: makeOntimeEvent({ id: 'top', parent: null }),
    group: makeOntimeGroup({ id: 'group', entries: ['nested'] }),
    nested: makeOntimeEvent({ id: 'nested', parent: 'group' }),
  },
});

describe('insertion anchor validation', () => {
  test('rejects a missing anchor', () => {
    expect(() => assertInsertAnchorInOrder(rundown, null, { before: 'missing' })).toThrow(
      'Insertion anchor with ID missing does not exist',
    );
  });

  test('rejects an anchor from a different order', () => {
    expect(() => assertInsertAnchorInOrder(rundown, null, { after: 'nested' })).toThrow(
      'Insertion anchor with ID nested is not in the target order',
    );
  });

  test('accepts a group-local anchor', () => {
    const group = rundown.entries.group as OntimeGroup;

    expect(() => assertInsertAnchorInOrder(rundown, group, { before: 'nested' })).not.toThrow();
  });

  test('checks clone anchors exist', () => {
    expect(() => assertInsertAnchorExists(rundown, { after: 'missing' })).toThrow(
      'Insertion anchor with ID missing does not exist',
    );
  });
});
