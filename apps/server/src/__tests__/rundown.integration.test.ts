import { EntryId, OntimeEntry, OntimeEvent, OntimeGroup, ProjectRundownsList, Rundown } from 'ontime-types';
import { MILLIS_PER_HOUR as HOUR } from 'ontime-utils';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * The rundown HTTP API (/data/rundowns) is what the editor and external tools use to change the show
 * Each test works in its own rundown, which also proves edits do not need the rundown to be loaded
 */
describe('rundown editing', { timeout: 15_000 }, () => {
  let server: TestServer;
  let rundownNumber = 0;

  // starting the server loads the full module graph, which takes a few seconds on slower machines
  beforeAll(async () => {
    server = await startTestServer();
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
  });

  async function json<T>(pending: Response | Promise<Response>): Promise<{ status: number; body: T }> {
    const response = await pending;
    return { status: response.status, body: await response.json() };
  }

  async function createRundown(title = 'Test rundown') {
    const { body } = await json<ProjectRundownsList>(await server.send('POST', '/data/rundowns', { title }));
    return body.rundowns.find((rundown) => rundown.title === title)!.id;
  }

  async function readRundown(id: string): Promise<Rundown> {
    return (await json<Rundown>(await server.get(`/data/rundowns/${id}`))).body;
  }

  function api(rundownId: string) {
    const base = `/data/rundowns/${rundownId}`;
    return {
      id: rundownId,
      read: () => readRundown(rundownId),
      add: (payload: object) => json<OntimeEntry>(server.send('POST', `${base}/entry`, payload)),
      edit: (payload: object) => json<OntimeEntry>(server.send('PUT', `${base}/entry`, payload)),
      send: (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: object) =>
        json<Rundown & { message?: string }>(server.send(method, `${base}${path}`, body)),
    };
  }

  /** Creates a rundown with consecutive one hour events starting at 10:00, returns their ids in order */
  async function rundownWithEvents(titles: string[]) {
    const rundown = api(await createRundown(`rundown-${++rundownNumber}`));
    const ids: EntryId[] = [];
    // added one at a time, the order of creation is the order of the rundown
    for (const [index, title] of titles.entries()) {
      const { body } = await rundown.add({ type: 'event', title, timeStart: (10 + index) * HOUR, duration: HOUR });
      ids.push(body.id);
    }
    return { rundown, ids };
  }

  const event = (rundown: Rundown, id: EntryId) => rundown.entries[id] as OntimeEvent;
  const titles = (rundown: Rundown) => rundown.flatOrder.map((id) => (rundown.entries[id] as OntimeEvent).title);

  test('adds entries before or after an existing entry', async () => {
    const { rundown, ids } = await rundownWithEvents(['first', 'third']);

    const { status, body } = await rundown.add({
      type: 'event',
      title: 'second',
      timeStart: 10.5 * HOUR,
      duration: HOUR / 2,
      after: ids[0],
    });

    expect(status).toBe(201);
    expect(body).toMatchObject({ title: 'second', timeStart: 10.5 * HOUR, timeEnd: 11 * HOUR });
    const result = await rundown.read();
    expect(titles(result)).toStrictEqual(['first', 'second', 'third']);
    expect(result.order).toStrictEqual(result.flatOrder);

    await rundown.add({ type: 'event', title: 'opener', timeStart: 9 * HOUR, duration: HOUR, before: ids[0] });
    expect(titles(await rundown.read())).toStrictEqual(['opener', 'first', 'second', 'third']);
  });

  test('refuses invalid additions and leaves the rundown untouched', async () => {
    const { rundown, ids } = await rundownWithEvents(['first']);
    const before = await rundown.read();

    const duplicate = await rundown.add({ type: 'event', id: ids[0], title: 'again' });
    expect(duplicate.status).toBe(400);
    expect(duplicate.body).toMatchObject({ message: expect.stringContaining('already exists') });

    const notAGroup = await rundown.add({ type: 'event', title: 'orphan', parent: ids[0] });
    expect(notAGroup.status).toBe(400);

    const missingRundown = await json<{ message: string }>(
      await server.send('POST', '/data/rundowns/does-not-exist/entry', { type: 'event', title: 'lost' }),
    );
    expect(missingRundown.status).toBe(400);
    expect(missingRundown.body.message).toContain('not found');

    expect(await rundown.read()).toStrictEqual(before);
  });

  test('editing an entry advances its revision and the rundown, but not the rest of the entries', async () => {
    const { rundown, ids } = await rundownWithEvents(['first', 'second']);
    const before = await rundown.read();

    const { status, body } = await rundown.edit({ id: ids[0], title: 'renamed', note: 'check mics' });

    expect(status).toBe(200);
    expect(body).toMatchObject({ title: 'renamed', note: 'check mics' });
    const after = await rundown.read();
    expect(event(after, ids[0]).revision).toBe(event(before, ids[0]).revision + 1);
    expect(event(after, ids[1])).toStrictEqual(event(before, ids[1]));
    expect(after.revision).toBeGreaterThan(before.revision);
  });

  test('applies the same change to several entries at once', async () => {
    const { rundown, ids } = await rundownWithEvents(['first', 'second', 'third']);

    const { status } = await rundown.send('PUT', '/batch', { ids: [ids[0], ids[2]], data: { colour: 'red' } });

    expect(status).toBe(200);
    const result = await rundown.read();
    expect([ids[0], ids[1], ids[2]].map((id) => event(result, id).colour)).toStrictEqual(['red', '', 'red']);
  });

  test('deletes the requested entries, or all of them', async () => {
    const { rundown, ids } = await rundownWithEvents(['first', 'second', 'third']);

    const { body: afterDelete } = await rundown.send('DELETE', '/entries', { ids: [ids[1]] });
    expect(titles(afterDelete)).toStrictEqual(['first', 'third']);
    expect(afterDelete.entries[ids[1]]).toBeUndefined();

    const { body: afterDeleteAll } = await rundown.send('DELETE', '/all');
    expect(afterDeleteAll.flatOrder).toStrictEqual([]);
    expect(afterDeleteAll.entries).toStrictEqual({});
  });

  test('reorders an entry before or after another', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b', 'c']);

    const moveLast = await rundown.send('PATCH', '/reorder', {
      entryId: ids[2],
      destinationId: ids[0],
      order: 'before',
    });
    expect(titles(moveLast.body)).toStrictEqual(['c', 'a', 'b']);

    const moveFirst = await rundown.send('PATCH', '/reorder', {
      entryId: ids[2],
      destinationId: ids[1],
      order: 'after',
    });
    expect(titles(moveFirst.body)).toStrictEqual(['a', 'b', 'c']);
  });

  test('groups events, keeping the group consistent, and ungroups them back to the top level', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b', 'c']);

    const { status, body: grouped } = await rundown.send('POST', '/group', { ids: [ids[0], ids[1]] });

    expect(status).toBe(200);
    const group = grouped.order.map((id) => grouped.entries[id]).find((entry) => entry.type === 'group') as OntimeGroup;
    expect(group.entries).toStrictEqual([ids[0], ids[1]]);
    expect(grouped.order).toStrictEqual([group.id, ids[2]]);
    expect(grouped.flatOrder).toStrictEqual([group.id, ids[0], ids[1], ids[2]]);
    expect(event(grouped, ids[0]).parent).toBe(group.id);
    expect(event(grouped, ids[1]).parent).toBe(group.id);
    expect(group.duration).toBe(2 * HOUR);

    const { body: ungrouped } = await rundown.send('POST', `/ungroup/${group.id}`);

    expect(ungrouped.entries[group.id]).toBeUndefined();
    expect(ungrouped.order).toStrictEqual(ids);
    expect(ungrouped.flatOrder).toStrictEqual(ids);
    expect(event(ungrouped, ids[0]).parent).toBeNull();
  });

  test('moves an event into a group and out again', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b', 'c']);
    const { body: grouped } = await rundown.send('POST', '/group', { ids: [ids[0]] });
    const groupId = grouped.order[0];

    const { body: inside } = await rundown.send('PATCH', '/reorder', {
      entryId: ids[2],
      destinationId: groupId,
      order: 'insert',
    });
    expect((inside.entries[groupId] as OntimeGroup).entries).toStrictEqual([ids[0], ids[2]]);
    expect(event(inside, ids[2]).parent).toBe(groupId);
    expect(inside.order).toStrictEqual([groupId, ids[1]]);

    const { body: outside } = await rundown.send('PATCH', '/reorder', {
      entryId: ids[2],
      destinationId: ids[1],
      order: 'after',
    });
    expect((outside.entries[groupId] as OntimeGroup).entries).toStrictEqual([ids[0]]);
    expect(event(outside, ids[2]).parent).toBeNull();
    expect(outside.order).toStrictEqual([groupId, ids[1], ids[2]]);
  });

  test('clones an entry with a new identity, next to the original', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b']);
    await rundown.edit({ id: ids[0], note: 'keep this' });

    const { status, body } = await rundown.send('POST', `/clone/${ids[0]}`, { after: ids[0] });

    expect(status).toBe(200);
    expect(titles(body)).toStrictEqual(['a', 'a', 'b']);
    const [original, copy] = body.flatOrder;
    expect(original).toBe(ids[0]);
    expect(copy).not.toBe(ids[0]);
    expect(event(body, copy)).toMatchObject({ title: 'a', note: 'keep this', duration: HOUR });
  });

  test('swaps the contents of two events but not their position', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b']);
    await rundown.edit({ id: ids[1], title: 'b', note: 'only on b', duration: HOUR / 2 });

    const { status, body } = await rundown.send('PATCH', '/swap', { from: ids[0], to: ids[1] });

    expect(status).toBe(200);
    expect(body.flatOrder).toStrictEqual(ids);
    expect(event(body, ids[0])).toMatchObject({ id: ids[0], title: 'b', note: 'only on b' });
    expect(event(body, ids[1])).toMatchObject({ id: ids[1], title: 'a', note: '' });
  });

  test('a delay moves the events after it, and applying it makes the change permanent', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b', 'c']);
    const { body: delay } = await rundown.add({ type: 'delay', duration: 10 * 60_000, after: ids[0] });
    const delayed = await rundown.read();
    expect(event(delayed, ids[0]).delay).toBe(0);
    expect(event(delayed, ids[1]).delay).toBe(10 * 60_000);
    expect(event(delayed, ids[2]).delay).toBe(10 * 60_000);
    expect(event(delayed, ids[1]).timeStart).toBe(11 * HOUR);

    const { status, body: applied } = await rundown.send('PATCH', `/applydelay/${delay.id}`);

    expect(status).toBe(200);
    expect(applied.entries[delay.id]).toBeUndefined();
    expect(applied.flatOrder).toStrictEqual(ids);
    expect(event(applied, ids[0])).toMatchObject({ timeStart: 10 * HOUR, delay: 0 });
    expect(event(applied, ids[1])).toMatchObject({ timeStart: 11 * HOUR + 10 * 60_000, delay: 0 });
    expect(event(applied, ids[2])).toMatchObject({ timeStart: 12 * HOUR + 10 * 60_000, delay: 0 });
  });

  test('renumbers the cues of the selected events', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b', 'c']);

    const { status, body } = await rundown.send('PATCH', '/renumber', {
      ids: [ids[0], ids[1], ids[2]],
      prefix: 'S',
      start: '10',
      increment: '5',
    });

    expect(status).toBe(200);
    expect(ids.map((id) => event(body, id).cue)).toStrictEqual(['S 10', 'S 15', 'S 20']);
  });

  test('fits an event to the target duration of its group', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b']);
    const { body: grouped } = await rundown.send('POST', '/group', { ids });
    const groupId = grouped.order[0];
    await rundown.edit({ id: groupId, targetDuration: 3 * HOUR });

    const { status, body } = await rundown.send('POST', `/${ids[1]}/fit-group-duration`);

    expect(status).toBe(200);
    expect(event(body, ids[1]).duration).toBe(2 * HOUR);
    expect((body.entries[groupId] as OntimeGroup).duration).toBe(3 * HOUR);
  });

  test('refuses operations which do not apply to the entries given, leaving the rundown untouched', async () => {
    const { rundown, ids } = await rundownWithEvents(['a', 'b']);
    const before = await rundown.read();

    const responses = [
      await rundown.edit({ id: 'missing', title: 'ghost' }),
      await rundown.send('PATCH', '/reorder', { entryId: ids[0], destinationId: 'missing', order: 'after' }),
      await rundown.send('POST', `/ungroup/${ids[0]}`), // an event is not a group
      await rundown.send('POST', `/${ids[0]}/fit-group-duration`), // an event outside a group has no target
    ];

    expect(responses.map(({ status }) => status)).toStrictEqual([400, 400, 400, 400]);
    expect(await rundown.read()).toStrictEqual(before);
  });

  describe('managing rundowns', () => {
    async function listRundowns() {
      return (await json<ProjectRundownsList>(await server.get('/data/rundowns'))).body;
    }

    test('creates, renames and duplicates a rundown without touching the loaded one', async () => {
      const { loaded } = await listRundowns();
      const { rundown, ids } = await rundownWithEvents(['a', 'b']);
      await json(await server.send('PATCH', `/data/rundowns/${rundown.id}`, { title: 'Renamed' }));

      const { status, body } = await json<ProjectRundownsList>(
        await server.send('POST', `/data/rundowns/${rundown.id}/duplicate`),
      );

      expect(status).toBe(201);
      expect(body.loaded).toBe(loaded);
      const copy = body.rundowns.find((entry) => entry.title === 'Copy of Renamed')!;
      expect(copy.numEntries).toBe(2);
      expect(copy.id).not.toBe(rundown.id);

      // the copy is independent from the original
      await json(await server.send('PUT', `/data/rundowns/${copy.id}/entry`, { id: ids[0], title: 'changed in copy' }));
      expect(titles(await rundown.read())).toStrictEqual(['a', 'b']);
      expect(titles(await readRundown(copy.id))).toStrictEqual(['changed in copy', 'b']);
    });

    test('loads a rundown, which becomes the current one', async () => {
      const original = (await listRundowns()).loaded;
      const { rundown } = await rundownWithEvents(['a']);

      const { status, body } = await json<ProjectRundownsList>(
        await server.send('POST', `/data/rundowns/${rundown.id}/load`),
      );

      expect(status).toBe(200);
      expect(body.loaded).toBe(rundown.id);
      const current = (await json<Rundown>(await server.get('/data/rundowns/current'))).body;
      expect(current.id).toBe(rundown.id);

      await server.send('POST', `/data/rundowns/${original}/load`);
      expect((await listRundowns()).loaded).toBe(original);
    });

    test('deletes a rundown which is not loaded, but refuses to delete the loaded one', async () => {
      const { loaded } = await listRundowns();
      const { rundown } = await rundownWithEvents(['a']);

      const loadedAttempt = await json<{ message: string }>(await server.send('DELETE', `/data/rundowns/${loaded}`));
      expect(loadedAttempt.status).toBe(400);
      expect(loadedAttempt.body.message).toContain('loaded');

      const { status, body } = await json<ProjectRundownsList>(
        await server.send('DELETE', `/data/rundowns/${rundown.id}`),
      );
      expect(status).toBe(200);
      expect(body.rundowns.map((entry) => entry.id)).not.toContain(rundown.id);
      expect((await server.get(`/data/rundowns/${rundown.id}`)).status).toBe(404);
    });
  });
});
