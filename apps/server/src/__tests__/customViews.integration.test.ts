import type { CustomViewsListResponse } from 'ontime-types';

import { startTestServer, type TestServer } from './testServer.js';

function uploadView(server: TestServer, slug: string) {
  const body = new FormData();
  body.append('indexHtml', new Blob(['<!doctype html><html></html>'], { type: 'text/html' }), 'index.html');
  return server.request(`/data/custom-views/${slug}/upload`, { method: 'POST', body });
}

async function listViews(server: TestServer) {
  const { views }: CustomViewsListResponse = await (await server.get('/data/custom-views')).json();
  return views;
}

test('uploading a custom view which is not HTML answers 422 with the reason', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());
  const body = new FormData();
  body.append('indexHtml', new Blob(['just some text'], { type: 'text/html' }), 'index.html');

  const response = await server.request('/data/custom-views/my-view/upload', { method: 'POST', body });

  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    message: 'File does not appear to be valid HTML. Expected <!DOCTYPE html> or <html> at the start.',
  });
});

test(
  'custom views start hidden from the navigation menu and keep their choice across restarts',
  { timeout: 30_000 },
  async () => {
    let server = await startTestServer();
    onTestFinished(() => server.stop());
    expect((await uploadView(server, 'stage')).status).toBe(201);
    expect(await listViews(server)).toContainEqual({ slug: 'stage', displayInNav: false });

    const shown = await server.send('PATCH', '/data/custom-views/stage', { displayInNav: true });
    expect(shown.status).toBe(200);
    expect((await shown.json()).views).toContainEqual({ slug: 'stage', displayInNav: true });

    await server.stop();
    server = await startTestServer();
    expect(await listViews(server)).toContainEqual({ slug: 'stage', displayInNav: true });

    // a view uploaded again under a deleted name starts hidden
    // custom views live in the source tree in development, so the view is removed again
    expect((await server.send('DELETE', '/data/custom-views/stage')).status).toBe(204);
    expect((await uploadView(server, 'stage')).status).toBe(201);
    expect(await listViews(server)).toContainEqual({ slug: 'stage', displayInNav: false });
    await server.send('DELETE', '/data/custom-views/stage');
  },
);

test('showing a custom view which does not exist answers 404', { timeout: 15_000 }, async () => {
  const server = await startTestServer();
  onTestFinished(() => server.stop());

  const response = await server.send('PATCH', '/data/custom-views/missing', { displayInNav: true });

  expect(response.status).toBe(404);
});
