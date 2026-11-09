import { startTestServer } from './testServer.js';

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
